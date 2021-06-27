const { resolveSoa } = require("dns");
const { urlencoded } = require("express");
var express = require("express");
var app = express();
var path = require('path')

var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

const bodyParser = require("body-parser");
app.use( bodyParser.json() ); 
app.use(bodyParser.urlencoded({
    extended: true
}));

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'brandon.bolun.an@gmail.com',
    pass: '96y28p72'
  }
});

var mailOptions = {
  from: 'airbnb@gmail.com',
  to: 'brandon.bolun.an@gmail.com',
  subject: 'Welcome to Airbnb',
  text: 'Thank you for choosing Airbnb!'
};

const regex = new RegExp('^(?=.*[0-9]).{6,12}$');

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});

// setup another route to listen on /about
app.get("/listings", function (req, res) {
    res.sendFile(path.join(__dirname, '/views/listings.html'));
});

app.get("/registration", function (req, res) {
    res.sendFile(path.join(__dirname, '/views/registration.html'));
});

app.get("/login", function (req, res) {
    res.sendFile(path.join(__dirname, '/views/login.html'));
});

app.post('/checkNulls', function(req, res) {
    var username = req.body.uname
    var password = req.body.pword
    if (password.length == 0 || username.length == 0)
    {
        res.send('Please Enter Both Fields')
    }
    else
    {
      res.sendFile(path.join(__dirname, '/views/index.html'));
    }
    
});

app.post('/checkPassword', function(req, res) {
    var password = req.body.password
    if (!regex.test(password))
    {
        res.send('Invalid password')
    }
    else
    {
        transporter.sendMail
        res.sendFile(path.join(__dirname, '/views/dashboard.html'));
    }
    
});

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);