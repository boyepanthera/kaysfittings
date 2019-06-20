const express = require('express');
const app = express ();
const mongoose = require ('mongoose');
const LocalStrategy =  require ('passport-local');
const passport = require('passport');
const port = 0907 || process.env.PORT
const bodyParser = require('body-parser');
const flash = require ('connect-flash');
const methodOverride = require('method-override');
const expressSession = require ('express-session');

// require model files
const User= require('./models/User.js');
const Bedding = require('./models/Bedding.js');

// require controller files
const beddingController = require('./controllers/beddings.js');
const indexController = require('./controllers/index.js');

// Setting the template engine
app.set("view engine", "ejs");

// Serving resources on public directory
app.use(express.static(__dirname + "/public"));

// configuring flash for usage
app.use(flash());

// Mongoose configuration
// let url = 'mongodb://localhost:27017/kayfittingsoffline';
let url = process.env.DATABASEURL;
mongoose.connect(url, {
    useNewUrlParser: true,
    useCreateIndex: true,
});

// BodyParser configuration
app.use(bodyParser.urlencoded({
    extended: true
}));
// app.use(bodyParser.json());

// MethodOverride configuration
app.use(methodOverride('_method'));

// momentJs configuration
app.locals.moment = require('moment');
// Requiring and using express session used to encode/decode user session
app.use(expressSession({
    secret: "How to crack the Senseless in the Sense",
    resave: false,
    saveUninitialized: false,
}));

// Configuration of session in passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// middleware to pass currentUser details into every route template
app.use(function (req, res, next) {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.currentUser = req.user;
    next();
});

app.use('/' , beddingController);
app.use('/', indexController);
const server = app.listen (port, (req, res) => console.log ('Kayfittings app started on port ' + port));
