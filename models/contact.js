const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    fName: {
        type: 'string',
        required: true
    },
    lName: {
        type: 'string',
        required: true
    },
    email: {
        type: 'string',
        required: true,
        unique: true
    },
    age: 'number',
    sex: 'string'
});
const Contact = mongoose.model('Contact', schema);
module.exports = Contact;