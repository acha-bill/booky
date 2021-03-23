$(function () {
    $.ajax({
        url: `http://localhost:8080/contacts`,
        dataType: "json",
        async: true,
        success: function (data) {
            console.log(data)
            renderData(data)
        }
    });

    $("#download-btn").click(function () {
        fetch("http://localhost:8080/contacts?download=true").then(async res => {
            let text = await res.text()
            download("contacts.csv", text)
        })
    })
})

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

var renderData = function (data) {
    let result = ""
    // for (var i = 0; i < 50; i++) {
    //     data.push(data[0])
    // }
    data.forEach((c, i) => {
        result +=
            `<tr><td>${i + 1}</td>
        <td>${c.fName}</td>
        <td>${c.lName}</td>
        <td>${c.email}</td>
        <td>${c.sex}</td>
        <td>${c.age}</td></tr>`
    })
    console.log(result)
    $("#tbody").html(result)
}
