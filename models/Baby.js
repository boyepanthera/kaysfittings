const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const babySchema = new Schema({
    productName: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
    },
    description: String,
    comments: [{
        body: String,
        date: Date
    }],
    date: {
        type: Date,
        default: Date.now
    },
    price: Number,
    image: String,
    imageId: String,
    sizes: [],
    patterns: [],
    quantity: Number,
    colors: []
});
const Baby = mongoose.model('Baby', babySchema);
module.exports = Baby;
