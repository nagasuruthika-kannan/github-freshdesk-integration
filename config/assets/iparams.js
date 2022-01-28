const dropdown = document.querySelector(".text-field-2");

document.onreadystatechange = function () {
  if (document.readyState === "interactive") renderApp();
  async function renderApp() {
    try {
      var client = await app.initialized();
      window.client = client;
      client.request
        .get("https://api.github.com/user/repos", {
          headers: {
            Authorization: "token <%= access_token %>",
            "User-Agent": "sample-App",
          },
          isOAuth: true,
        })

        .then(
          function (res) {
            var options = "";
            var data = [res];
            data_new = data[0].response;
            data_json = JSON.parse(data_new);

            for (var i = 0; i < data_json.length; i++) {
              //console.log(typeof data_json);
              //console.log("Hi", );

              $("#selectoption").append(
                '<option value="' +
                  data_json[i].full_name +
                  '">' +
                  data_json[i].full_name +
                  "</option>"
              );
            }
          },

          function (err) {
            console.log("Unable to fetch repos github", err);
          }
        );
    } catch (error) {
      return console.error(error);
    }
  }
};

dropdown.addEventListener("fwOptionClick", function updLablOfDrpdwn() {
  return dropdown.setAttribute("label", dropdown.value);
});
