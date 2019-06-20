const mongoose = require("mongoose");
const passportLocalMongoose = require('passport-local-mongoose');
// Schema for users
const Schema = mongoose.Schema;
const userSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: String,
    firstName: String,
    lastName: String,
    email: {
        type: String,
        unique: true,  
        required: true
        },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    phone: Number
});

userSchema.plugin(passportLocalMongoose);
// creating users collections in the DB
var User = mongoose.model("User", userSchema);
module.exports = User;