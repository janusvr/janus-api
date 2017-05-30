(function() {

function updateResults() {
    var keyword = document.getElementById('keyword').value; 
    var xhr = new XMLHttpRequest();
    var endpoint = "/room/search?keyword="+keyword+"&has_equi=true";
    var div = document.getElementById('rooms');
 
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }

    var onData = function(response) {
        var parsed = JSON.parse(response);
        for (var i = 0; i < parsed.data.length; i++) {
            var li = document.createElement("li");
            li.className = "media";
            div.append(li);

            var link = document.createElement('a');
            link.href = "https://web.janusvr.com/sites/"+parsed.data[i].url;
            link.target = "_blank";
            li.append(link);
            
            var img = document.createElement('img');
            img.className = "d-flex mr-3 img-fluid";
            img.src = parsed.data[i].equi;
            link.append(img);

            var body = document.createElement('div');
            body.className = "media-body";
            body.innerHTML += "<h5>"+parsed.data[i].roomtitle+"</h5>";
            body.innerHTML += parsed.data[i].meta_description;
            li.append(body);
        }
    }

    xhr.onreadystatechange = function() {
        if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
            onData(xhr.responseText); 
        }
    }

    xhr.open('GET', endpoint, true);
    xhr.send();
}

$(document).ready(function() {
    var form = document.getElementById('form');
    form.addEventListener("submit", function(ev) {
        console.log(ev);
        ev.preventDefault();
        updateResults();
    });
}); 

})();
