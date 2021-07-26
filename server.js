const { resolveSoa } = require("dns");
const { urlencoded } = require("express");
var express = require("express");
var app = express();
var path = require('path')
const clientSessions = require("client-sessions");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');


var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

mongoose.connect('mongodb+srv://ban4:C4nada0310@cluster0.8yeox.mongodb.net/web322_week8?retryWrites=true&w=majority', { useNewUrlParser: true }, { useUnifiedTopology: true });

var userSchema = new Schema({
  "username": String,
  "password": String,
  "email": String
})

var User = mongoose.model("web322_users", userSchema)








const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'brandon.bolun.an@gmail.com',
    pass: '96Y28P72'
  }
});

var mailOptions = {
  from: 'airbnb@gmail.com',
  to: 'brandon.bolun.an@gmail.com',
  subject: 'Welcome to Airbnb',
  text: 'Thank you for choosing Airbnb!'
};

const regex = new RegExp('^(?=.*[0-9]).{6,12}$');

transporter.sendMail(mailOptions, function (error, info) {
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

app.post('/loginCheck', async (req, res) => {
  var thisUsername = req.body.uname
  var thisPassword = req.body.pword
  if (thisPassword.length == 0 || thisUsername.length == 0) {
    res.send('Please Enter Both Fields')
  }
  else {
    console.log(`login before:`, thisPassword, `*`);
    const hashedPassword = await bcrypt.hash(thisPassword, 10);
    console.log(`login after:`, hashedPassword, `*`);

    User.find({
      username: thisUsername
    })
      .exec()
      .then((companies) => {

        companies = companies.map(value => value.toObject());
        console.log(companies);

        if (bcrypt.compareSync(thisPassword, companies[0].password)) {
          console.log(`password true:`, thisPassword)
          res.sendFile(path.join(__dirname, '/views/dashboard.html'));
        } else {
          res.send('Invalid password')
        }
      })
  }
});

app.post('/registrationCheck', async (req, res) => {
  var password = req.body.password
  if (!regex.test(password)) {
    res.send('Invalid password')
  }
  else {
    console.log(`register before:`, password, `*`);
    const hashedPassword = await bcrypt.hash(password);
    console.log(`register after:`, hashedPassword, `*`);

    var newAcc = new User({
      username: req.body.fname,
      password: hashedPassword,
      email: req.body.email
    })

    console.log(newAcc)

    newAcc.save((err) => {
      if (err) {
        console.log("There was an error saving the user");
      } else {
        console.log("The user was saved to the collection");
      }
    });

    transporter.sendMail
    res.sendFile(path.join(__dirname, '/views/dashboard.html'));
  }
});

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);