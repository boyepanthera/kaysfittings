const express = require ('express');
const router = express.Router({
    mergeParams: true
});
require('dotenv');
const User = require ('../models/User');
const nodemailer = require('nodemailer');
const passport = require ('passport')
router.route('/login')
    .get((req, res) => {
        res.render('login')
    })
    .post(passport.authenticate("local", {
                    successRedirect: "/",
                    successFlash: "You Successfully signed in",
                    failureRedirect: "/login",
                    failureFlash: "There's an error check your credentials"
                }), (req, res) => {
        
    });

router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "You logged out, See you later!")
    res.redirect("/");
});

router.route('/register')
    .get((req, res) => {
        res.render('register')
    })
    .post((req, res)=> {
            let newUser = new User({
                username: req.body.username,
                email : req.body.email,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                phone: req.body.phone,
            });
            if (req.body.isAdmin === process.env.isAdmin) {
                newUser.isAdmin = true;
            }
            User.register(newUser, req.body.password, function (err, user) {
                if (err) {
                    console.log(err);
                    req.flash("error", err.message);
                    return res.redirect('/register');
                }
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/');
                });
            });
    });

router.get("/admin", isAdminLoggedIn, (req, res) => {
    res.render('admin');
});

function isAdminLoggedIn  (req, res, next) {
    if (req.isAuthenticated() && req.user.isAdmin) {
       return next()
    } else {
        req.flash('error', 'You need to be an admin to do that');
        return res.redirect('/login');
    }
}
module.exports = router;