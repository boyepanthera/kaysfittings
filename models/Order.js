const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
    orderName: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
    },
    orderPrice: Number,
    date: {
        type: Date,
        default: Date.now
    },
    color: String,
    size:String,
    pattern:String,
});
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
