document.addEventListener("DOMContentLoaded", function () {
  /**
	* Initialize channel
	* @param {string} _client - A string param

	*/
  app.initialized().then(function (_client) {
    window.client = _client;

    client.events.on("app.activated", function () {
      client.db.get("github-app-key-new").then(function (data) {

        var obj = "";
   
 	//construction of columns
        obj += "<th>" + "Tickets" + "</th>";
        obj += "<th>" + "Issues" + "</th>";

      	//construction of rows
        obj += "<tr>";
        obj += "<td>" + data["ticket"] + "</td>";

        obj += "<td>" + data["issue"] + "</td>";

        obj += "</tr>";
        document.getElementById("table").innerHTML = obj; //INSERTING ROWS INTO TABLE


        //debugger;
      });
    });
  });
});
