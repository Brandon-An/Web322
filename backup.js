const { resolveSoa } = require("dns");
const { urlencoded } = require("express");
var express = require("express");
var app = express();
var path = require('path')
var nodemailer = require('nodemailer');
const clientSessions = require("client-sessions");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var HTTP_PORT = process.env.PORT || 8080;

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// mongoose.connect('mongodb+srv://ban4:C4nada0310@cluster0.8yeox.mongodb.net/web322_week8?retryWrites=true&w=majority', { useNewUrlParser: true }, { useUnifiedTopology: true });

// var userSchema = new Schema({
//   "username": String,
//   "password": String,
//   "email": String
// });

// var newUser = mongoose.model("airbnb_users", userSchema);

// app.use(clientSessions({ // sessions timer
//   cookieName: "session",
//   secret: "web322_week10",
//   duration: 5 * 60 * 1000,
//   activeDuration: 1000 * 6
// }));







var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "brandon.bolun.an@gmail.com",
    pass: "96Y28P72"
  }
});

var mailOptions = {
  from: 'airbnb@gmail.com',
  to: 'brandon.bolun.an@gmail.com',
  subject: 'Welcome to Airbnb',
  text: 'Thank you for choosing Airbnb!'
};



const regex = new RegExp('^(?=.*[0-9]).{6,12}$');

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

app.post('/loginCheck', function (req, res) {
  var username = req.body.uname
  var password = req.body.pword
  if (password.length == 0 || username.length == 0) {
    res.send('Please Enter Both Fields')
  }
  else {
    req.session.user = {
      username: user.username,
      email: user.email
    };
    res.sendFile(path.join(__dirname, '/views/index.html'));
  }

});

app.post('/registrationCheck', function (req, res) {
  var password = req.body.password
  if (!regex.test(password)) {
    res.send('Invalid password')
  }
  else {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    var user = new newUser({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email
    });

    user.save((err) => {
      if(err) {
        console.log("There was an error saving the user company");
      } else {
          console.log("The user was saved collection");
          Company.findOne({ username: req.body.username })
          .exec()
          .then((user) => {
              if(!user) {
                  console.log("No user could be found");
              } else {
                  console.log(user);
              }
              // exit the program after saving and finding
              process.exit();
          })
          .catch((err) => {
              console.log(`There was an error: ${err}`);
          });
      }   
  });

    res.sendFile(path.join(__dirname, '/views/dashboard.html'));
  }
});





// app.get("/logout", function (req, res) {
//   req.session.reset();
//   res.redirect("/views/login.html");
// });

// app.get("/views/dashboard.html", ensureLogin, (req, res) => {
//   res.render("/views/dashboard.html", { user: req.session.user, layout: false });
// });

// function ensureLogin(req, res, next) {
//   if (!req.session.user) {
//     res.redirect("/views/login.html");
//   } else {
//     next();
//   }
// }

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);