// load the things we need
var express = require('express');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const csv = require('csv-parser')
const fs = require('fs')



var upload = multer({ dest: 'files/' })


var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file
app.use("/views", express.static(__dirname + "/views"));


// index page 
app.get('/', function (req, res) {
    var mascots = [
        { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012 },
        { name: 'Tux', organization: "Linux", birth_year: 1996 },
        { name: 'Moby Dock', organization: "Docker", birth_year: 2013 }
    ];
    var tagline = "No programming concept is complete without a cute animal mascot.";

    res.render('pages/index', {
        mascots: mascots,
        tagline: tagline
    });
});


app.post('/upload', upload.single('file'), (req, res) => {
    switch (req.file.mimetype) {
        case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": // .xlsx
        case "application/vnd.ms-excel": //.xls
            readXlsxFile(req.file.path).then((rows) => {
                console.log(rows)
            })
        case "text/csv":
            const results = [];
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => {
                    console.log(results);
                });
    }
    fs.unlinkSync(req.file.path)
    res.send('done')
})

app.listen(8080);
