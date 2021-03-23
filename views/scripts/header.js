$(function () {
    fetchStats()
    setInterval(() => {
        fetchStats()
    }, 5000)

    $("#slider").slider({
        min: 1,
        max: 100,
        range: true,
        change: function (event, ui) {
            console.log(ui.values)
        }
    });
})

//TODO: this should be a socket connection to the server.
var fetchStats = function () {
    $.ajax({
        url: `http://localhost:8080/stats`,
        dataType: "json",
        async: true,
        success: function (data) {
            console.log(data)
            updateStats(data)
        }
    });
}
var updateStats = function (stats) {
    $("#nTotal").text(stats.nTotal)
    $("#nMale").text(stats.nMale)
    $("#nFemale").text(stats.nFemale)
}