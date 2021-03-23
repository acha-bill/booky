// load the things we need
require('dotenv').config()
const express = require('express');
const multer = require('multer');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs')
const mongoose = require('mongoose')
const upload = multer({ dest: 'files/' })
const Contact = require('./models/contact')
const StatusCodes = require('http-status-codes').StatusCodes
const csv = require('fast-csv');

const app = express();
const defaultLimit = 10

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file
app.use("/views", express.static(__dirname + "/views"));

// index page 
app.get('/', (req, res) => {
    res.render('pages/index');
});
app.get('/search', (req, res) => {
    res.render('pages/search')
})

// upload excel or csv flie
app.post('/upload', upload.single('file'), async (req, res) => {
    let getRows = (file) => {
        return new Promise((resolve, reject) => {
            switch (file.mimetype) {
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": // .xlsx
                case "application/vnd.ms-excel": //.xls
                    readXlsxFile(file.path).then(rows => {
                        let keys = rows[0]
                        let result = []
                        for (i = 1; i < rows.length; i++) {
                            let row = {}
                            for (j = 0; j < rows[i].length; j++) {
                                row[keys[j]] = rows[i][j]
                            }
                            result.push(row)
                        }
                        return resolve(result)
                    }).catch(e => {
                        return reject(err)
                    })
                    break;
                case "text/csv":
                    const rows = [];
                    fs.createReadStream(file.path)
                        .pipe(csv.parse({ headers: true }))
                        .on('error', error => console.error(error))
                        .on('data', row => rows.push(row))
                        .on('end', () => { return resolve(rows) });
                    break;
                default:
                    return reject(new Error('invalid file type'))
            }
        })
    }
    try {
        let rows = await getRows(req.file)
        fs.unlinkSync(req.file.path) //delete file
        await Contact.insertMany(rows)
        return res.status(StatusCodes.CREATED).json(rows)
    } catch (err) {
        return res.status(StatusCodes.BAD_REQUEST)
    }
})


// returns some stats
app.get('/stats', async (req, res) => {
    try {
        const nTotal = await Contact.count()
        const nMale = await Contact.count({
            sex: new RegExp(`.*m.*`, 'i')
        })
        const nFemale = await Contact.count({
            sex: new RegExp(`.*f.*`, 'i')
        })
        return res.status(StatusCodes.OK).json({ nTotal, nMale, nFemale })
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(err)
    }
})

// get contacts by search criteria
app.get('/contacts', async (req, res) => {
    let { skip, limit } = req.query
    if (isNaN(skip) || Number(skip) < 1) {
        skip = 1
    } else {
        skip = Number(skip)
    }
    if (isNaN(limit)) {
        limit = defaultLimit
    } else {
        limit = Number(limit)
    }

    const q = new RegExp(`.*${req.query.q}.*`, 'i');
    const qSex = new RegExp(`.*${req.query.sex}.*`, 'i')
    const qMinAge = req.query.minAge
    const qMaxAge = req.query.maxAge
    var mq = {}
    if (req.query.q) {
        mq['$or'] = [{ fName: q }, { lName: q }, { email: q }]
    }
    if (req.query.sex) {
        mq['sex'] = qSex
    }

    if (req.query.minAge || req.query.maxAge) {
        let ageRangeObj = {}
        if (req.query.minAge) {
            ageRangeObj['$gte'] = qMinAge
        }
        if (req.query.maxAge) {
            ageRangeObj['$lte'] = qMaxAge
        }
        mq['age'] = ageRangeObj
    }

    try {
        if (req.query.download) {
            limit = 0
            skip = 1
        }
        const contacts = await Contact.find(mq).limit(limit).skip((skip - 1) * limit)
        if (req.query.download) {
            let path = `${__dirname}/files/contacts.csv`
            fs.openSync(path, 'w')
            const csvStream = csv.format({ headers: true });
            let ws = fs.createWriteStream(path)
            csvStream.pipe(ws).on('end', () => process.exit());
            contacts.forEach(c => {
                // delete unwanted fields
                let _c = c.toJSON()
                delete _c["_id"]
                delete _c["__v"]
                csvStream.write(_c);
            })
            csvStream.end();
            ws.on('close', () => {
                setTimeout(() => {
                    fs.unlinkSync(path) //delete file after it has been sent.
                }, 500)
                return res.status(StatusCodes.OK).sendFile(path)
            })
        } else {
            return res.status(StatusCodes.OK).json(contacts)
        }
    } catch (err) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
    }
})

const port = process.env.PORT
const mongoURL = process.env.MONGO_URL
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true }).then(function () {
    app.listen(port);
    console.log(`listening on port: ${port}`)
}).catch(function (err) {
    console.error(err)
})