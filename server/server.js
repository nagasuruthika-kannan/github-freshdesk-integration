//retrieve IssueNumber for a given ticketID
function lookupIssueNumber(ticketID) {
  var dbKey = String(`fdTicket:${ticketID}`).substring(0, 30);
  return $db.get(dbKey);
}

//retrieve ticektID for a given IssueNumber
function lookupTicketId(issueNumber) {
  var dbKey = String(`gitIssue:${issueNumber}`).substring(0, 30);
  return $db.get(dbKey);
}

function updateData(data) {
  // deletes ticket id and issue number from db when ticket/issue is closed
  var dbKey = String(`fdTicket:${data.ticketID}`).substring(0, 30);
  var dbKey2 = String(`gitIssue:${data.issueNumber}`).substring(0, 30);

  Promise.all([$db.delete(dbKey), $db.delete(dbKey2)])
    .then(function () {
      console.log("success", "Data store is updated");
    })
    .catch(function (error) {
      console.error("Unable to persist data : ", error);
    });
}

/**
 * Store Github issue data using data storage API
 * @param {array} data Issue array to be set in data storage
 */

function setData(data) {
  var dbKey = String(`fdTicket:${data.ticketID}`).substring(0, 30);
  var dbKey2 = String(`gitIssue:${data.issueNumber}`).substring(0, 30);

  Promise.all([
    $db.set(dbKey, { issue_data: data }),
    $db.set(dbKey2, { issue_data: data }),
  ])
    .then(function () {
      console.log(
        "Success"
      );
    })
    .catch(function (error) {
      console.error("Unable to persist data : ", error);
    });
}

function createTicketHelper(payload) {
  const payloadData =
    typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;

  if (payloadData.action === "opened") {
    $request
      .post(`https://${payload.domain}/api/v2/tickets`, {
        headers: {
          Authorization: "Basic <%= encode(iparam.freshdesk_api_key) %>",
        },
        json: {
          status: 2,
          priority: 3,
          email: payload.iparams.ticket_email,
          subject: payloadData.issue.title,
          description: payloadData.issue.body,
        },
        method: "POST",
      })
      .then(
        function (data) {
          var ticketObj = {
            ticketID: data.response.id,
            issueID: payloadData.issue.id,
            issueNumber: payloadData.issue.number,
          };
          setData(ticketObj);
          $db.update("github-app-key-new", "increment", {
            ticket: 1,
            issue: 1,
          });

          console.log(
            "Successfully created ticket: " +
              data.response.id +
              " in Freshdesk for issue: " +
              payloadData.issue.number
          );
        },
        function (error) {
          console.log("Error: Failed to create ticket in Freshdesk");
          console.log(error);
        }
      );
  } else if (payloadData.action === "closed") {
    lookupTicketId(payloadData.issue.number).then(
      (data) => {
        $request
          .put(
            `https://${payload.domain}/api/v2/tickets/${data.issue_data.ticketID}`,
            {
              headers: {
                Authorization: "<%= encode(iparam.freshdesk_api_key) %>",
              },
              json: {
                status: 5,
              },
              method: "PUT",
            }
          )
          .then(
            () => {
              console.info("Successfully closed the ticket in Freshdesk");
              //var ticketObj = { ticketID: data.issue_data.ticketID, issueNumber: payloadData.issue.number };
            },
            (error) => {
              console.error("Error: Failed to close the ticket in Freshdesk");
              console.error(error);
            }
          );
      },
      (error) => {
        console.error(
          "Error: Failed to get issue data. Unable to create ticket"
        );
        console.error(error);
      }
    );
  }
}

function createIssueHelper(payload) {
  $request
    .post(
      `https://api.github.com/repos/${payload.iparams.github_repo_name}/issues`,
      {
        headers: {
          Authorization: "token <%= access_token %>",
          "User-Agent": "sample-App",
        },
        isOAuth: true,
        json: {
          title: payload.data.ticket.subject,
          body: payload.data.ticket.description_text,
        },
      }
    )

    .then(
      function (data) {
        response = data.response;

        console.log("Successfully created issue in github " + response);
        var ticket_id = payload.data.ticket.id;

        var ticketObj = {
          ticketID: ticket_id,
          issueID: response.id,
          issueNumber: response.number,
        };
        setData(ticketObj);
        $db.update("github-app-key-new", "increment", { ticket: 1, issue: 1 });
      },

      function (err) {
        console.log("Unable to create issue in github" + JSON.stringify(err));
      }
    );
}
/**function checkAndCreateTicket(ticketID, success, error) {

	var dbKey = String(`fdTicket:${ticketID}`).substring(0, 30);
  $db.get(dbKey)
		.then(success)
		.catch(error);
}

function checkAndCreateIssue(issueNumber, success, error) {

	var dbKey = String(`gitIssue:${issueNumber}`).substring(0, 30);
  $db.get(dbKey)
		.then(success)
		.catch(error);
}
*/

exports = {
  /**
   * Handler for onTicketCreate event
   *
   * Creates an issue in github with the same description,title  as in freshdesk
   *
   * @param {object} args - payload
   */
  onTicketCreateHandler: function (payload) {
    var dbKey = String(`fdTicket:${payload.data.ticket.id}`).substring(0, 30);
    //console.log("Here 2", $db.get(dbKey));
    $db.get(dbKey).then(
      function () {
        if (payloadData.action === "closed"){

        }
        // The record already exists - indicates it is already associated with Github issue
        console.log("A Github issue has been already created for this ticket.");
      },
      function (error) {
        //404 - Indicates that the record is not found in the data storage
        if (error.status === 404) {
          createIssueHelper(payload);
        }
      }
    );
  },
  /**
   * Handler for onTicketUpdate event
   *
   * Updates/closes an issue in github when a ticket is modified/closed in freshdesk
   *
   * @param {object} args - payload
   */

  onTicketUpdateHandler: function (payload) {
    ticket = payload.data.ticket;

    if (ticket.status == 5) {
      lookupIssueNumber(ticket.id)
        .then((dbResponse) => {
          issue_number = dbResponse.issue_data.issueNumber;
          $request
            .patch(
              `https://api.github.com/repos/${payload.iparams.github_repo_name}/issues/${issue_number}`,
              {
                headers: {
                  Authorization: "token <%= access_token %>",
                  "User-Agent": "Awesome-Octocat-App",
                },
                isOAuth: true,
                json: {
                  state: "closed",
                },
              }
            )
            .then(
              () => {
                var ticketObj = {
                  ticketID: ticket.id,
                  issueNumber: issue_number,
                };
                updateData(ticketObj);

                console.info("Successfully updated ticket in github");
              },
              (error) => {
                console.error("Error in updating ticket in github", error);
              }
            );
        })
        .catch((error) => {
          {
            console.error(
              "Error in finding the github ticket id to update",
              error
            );
          }
        });
    }
  },

  onInstallHandler: function (payload) {
    generateTargetUrl()
      .then(function (targetUrl) {
        $request
          .post(
            `https://api.github.com/repos/${payload.iparams.github_repo_name}/hooks`,
            {
              headers: {
                Authorization: "token <%= access_token %>",
                "User-Agent": "sample-App",
              },
              isOAuth: true,
              json: {
                name: "web",
                active: true,
                events: ["issues"],
                config: {
                  url: targetUrl,
                  content_type: "json",
                },
              },
            }
          )
          .then(
            (data) => {
              $db.set("githubWebhookId", { url: data.response.url }).then(
                function () {
                  console.info("Successfully stored the webhook in the db");
                  renderData();
                },
                (error) => {
                  console.error(
                    "Error: Failed to store the webhook URL in the db"
                  );
                  console.error(error);
                  renderData({ message: "The webhook registration failed" });
                }
              );
            },
            (error) => {
              console.error(
                "Error: Failed to register the webhook for GitHub repo"
              );
              console.error(error);
              renderData({ message: "The webhook registration failed" });
            }
          );
      })
      .fail(function () {
        console.error("Error: Failed to generate the webhook");
        renderData({ message: "The webhook registration failed" });
      });
  },

  /**
   * Handler for onAppUninstall event
   *
   * Gets the webhook URL from the data storage through $db that was stored during installation
   * Then deregister the webhook from GitHub with the URL over REST API
   *
   * @param {object} args - payload
   */
  onUnInstallHandler: function () {
    $db.get("githubWebhookId").then(
      function (data) {
        $request
          .delete(data.url, {
            headers: {
              Authorization: "token <%= access_token %>",
              "User-Agent": "sample-app",
              Accept: "application/json",
            },
            isOAuth: true,
          })
          .then(
            () => {
              console.info(
                "Successfully deregistered the webhook for GitHub repo"
              );
              renderData();
            },
            (error) => renderData({ error: error })
          );
      },
      (error) => {
        console.error(
          "Error: Failed to get the stored webhook URL from the db"
        );
        console.error(error);
        renderData({ message: "The webhook deregistration failed" });
      }
    );
  },

  /**
   * Handler for onExternalEvent event
   *
   * Checks if the received issue event is of action 'opened' ie new issue creation.
   * Creates a ticket in freshdesk with the issue title and description.
   * Checks if the received issue event is of action 'closed' ie closed issue.
   * Closes corresponding ticket in freshdesk .
   *
   * @param {object} payload - payload with the data from the third-party applications along with iparams and other adata
   */
  onExternalEventHandler: function (payload) {
    const payloadData =
      typeof payload.data === "string"
        ? JSON.parse(payload.data)
        : payload.data;
    var dbKey = String(`gitIssue:${payloadData.issue.number}`).substring(0, 30);

    $db.get(dbKey).then(
      function () {
        if (payloadData.action === "opened")
        {
        // The record already exists - indicates it is already associated with Github issue
        console.log("A Github issue has been already created for this ticket.");
        }
        else
        {createTicketHelper(payload);}
      },
      function (error) {
        //404 - Indicates that the record is not found in the data storage
        console.log("Error");
        if (error.status === 404) {
          createTicketHelper(payload);
        }
      }
    );
  },
};
