const mongoose = require('mongoose');

//shortener achema

const shortenerSchema = new mongoose.Schema({

    user1: {
        type: String,
        trim: true,
        required: true,
    },

    name: {
        type: String,
        required: true
    },

    id: {
        type: String,
        required: true
    },

    original_link: {
        type: String,
        required: true,
        trim: true
    },

    short_link: {
        type: String,
        required: true,
        trim: true
    }

});

module.exports = mongoose.model('Shortener', shortenerSchema);