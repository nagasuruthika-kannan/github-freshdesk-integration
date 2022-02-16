document.addEventListener("DOMContentLoaded", function () {
  /**
   * Initialize channel
   * @param {string} _client - A string param
   */
  app.initialized().then(function (_client) {
    window.client = _client;

    client.events.on("app.activated", function () {
      client.data.get("ticket").then(
        function (data) {
          lookupIssue(data.ticket.id).then(
            function (data) {
              client.iparams.get("github_repo_name").then(function (iparam) {
                url = `https://github.com/${iparam.github_repo_name}/issues/${data.issue_data.issueNumber}`;

                issue_url = String(url);
                window.open(url); // navigation to github issue page
              });
            },
            function (error) {
              console.log("Error", error);
            }
          );
        },
        function (error) {
          console.log("error", error);
        }
      );
    });
  });
});

/**
 * Retrieve the issue from data storage
 * @param {Number} ticketID Ticket ID
 */

function lookupIssue(ticketID) {
  var dbKey = String(`fdTicket:${ticketID}`).substring(0, 30);
  console.log(dbKey);
  return client.db.get(dbKey);
}
