(function() {
var xhr = new XMLHttpRequest();
var keyword = "test";
var endpoint = "/room/search?keyword="+keyword+"&has_equi=true";

function done(response) {
    var parsed = JSON.parse(response);
    console.log(response);
    console.log(parsed);
    var div = document.getElementById('images');
    for (var i = 0; i < parsed.length; i++)
        div.append(parsed[i].equi)
}

xhr.onreadystatechange = function() {
    if (xhr.readystate == 4) {
            done(xhr.responseText); 
    }
}

xhr.open('GET', endpoint, true);
xhr.send();

})();
