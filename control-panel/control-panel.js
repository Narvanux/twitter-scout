document.getElementById('set-bg-file').addEventListener('click', function() {
    var file = document.getElementById('file-input').files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(event) {
        var contents = event.target.result;
        var inputJSON = JSON.parse(contents);
        browser.runtime.sendMessage({ type: 'setDB', data: inputJSON })
    };
    reader.readAsText(file);
});

document.getElementById('set-bg-def').addEventListener('click', function() {
    browser.runtime.sendMessage({ type: 'setDB', data: {} })
});

document.getElementById('save-as').addEventListener('click', function() {
    var a = document.createElement("a");
    browser.runtime.sendMessage({ type: "getDB" })
    .then(response => {
        if (response.status == true) {
            let resp = JSON.stringify(response.database);
            a.href = window.URL.createObjectURL(new Blob([resp], {type: "text/plain"}));
            a.download = "db.json";
            a.click(); 
        }
    })
});

document.getElementById('sync').addEventListener('click', function() {
    browser.runtime.sendMessage({ type: "getDB" })
    .then(response => {
        if (response.status == true) {
            var str = JSON.stringify(response.database, null, 4);
            document.querySelector('#content').textContent = str
        }
    })
    .catch(error => {
        console.error("Error receiving variable from background:", error);
    });
});