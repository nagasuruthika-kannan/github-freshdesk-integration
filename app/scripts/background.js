document.addEventListener("DOMContentLoaded", function () {
  /**
	* Initialize channel
	* @param {string} _client - A string param

	*/
  app.initialized().then(function (_client) {
    window.client = _client;

    client.events.on("app.activated", function () {
      client.db.get("github-app-key-new").then(function (data) {
        // var elem = document.getElementById('table');

        // FETCHING DATA FROM JSON FILE

        var obj = "";

        // ITERATING THROUGH OBJECTS
        obj += "<th>" + "Tickets" + "</th>";
        obj += "<th>" + "Issues" + "</th>";

        //CONSTRUCTION OF ROWS HAVING
        // DATA FROM JSON OBJECT
        obj += "<tr>";
        obj += "<td>" + data["ticket"] + "</td>";

        obj += "<td>" + data["issue"] + "</td>";

        obj += "</tr>";
        document.getElementById("table").innerHTML = obj; //INSERTING ROWS INTO TABLE

        //console.log(typeof(data))

        //console.log('0 here:',data.linked_data);
        //console.log('1 here',result[1]);
        //var obj= data.linked_data
        //console.log('0 here:',data.linked_data['0']['ticket']);

        //debugger;
      });
    });
  });
});
