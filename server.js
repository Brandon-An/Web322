const { resolveSoa } = require("dns");
const { urlencoded, json } = require("express");
var express = require("express");
var app = express();
const exphbs = require("express-handlebars");
var path = require('path')
const clientSessions = require("client-sessions");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');
const saltRounds = 10;
const fs = require("fs");
const multer = require("multer");
var nodemailer = require('nodemailer');
const { assert } = require("console");

app.engine(".hbs", exphbs({ extname: ".hbs" }));
app.set("view engine", ".hbs");

app.use('/img', express.static(__dirname + '/uploads'));

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

app.use(clientSessions({
  cookieName: "session", // this is the object name that will be added to 'req'
  secret: "assignment_secret_web322", // this should be a long un-guessable string.
  duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
  activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));

const user = {
  "username": String,
  "password": String,
  "email": String
};

// schema for new listings
var listingSchema = new Schema({
  "title": String,
  "price": String,
  "description": String,
  "location": String,
  "filename": String
})

var Listing = mongoose.model("web322_listings", listingSchema)


const storage = multer.diskStorage({ // notice you are calling the multer.diskStorage() method here, not multer()
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
const upload = multer({ storage }); //provide the return value from 

const handleError = (err, res) => {
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
};


const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'brandon.bolun.an@gmail.com',
    pass: '96Y28P72'
  }
});

var welcomeMail = {
  from: 'airbnb@gmail.com',
  to: 'brandon.bolun.an@gmail.com',
  subject: 'Welcome to Airbnb',
  text: 'Thank you for choosing Airbnb!'
};



const regex = new RegExp('^(?=.*[0-9]).{6,12}$');

// setup a 'route' to listen on the default url path (http://localhost)
app.get("/", function (req, res) {
  res.render("index", { layout: false });
});

// setup another route to listen on /about
app.get("/listings", async function (req, res) {
  var title = ''
  var description = ''
  var price = ''
  var rooms = ''

  await Listing.find({})
    .exec()
    .then((listing) => {

      listing = listing.map(value => value.toObject());

      for (var i = 0; i < listing.length; ++i) {
        filename = listing[i].filename
        title = listing[i].title
        description = listing[i].description
        price = listing[i].price
        rooms += '<div class="listing"><a href="details/?uniqueId=' + filename
          + '"><div class="image">'
          + '<img src="img/' + filename
          + '"></div></a>'
          + '<div class="title">' + title
          + '</div>'
          + '<div class="desc">' + description
          + '</div>'
          + '<div class="rate">' + price
          + ' CAD/night</div></div>'
      }
    })

  res.render("listings", { rooms, layout: false });

});

app.get("/registration", function (req, res) {
  res.render("registration", { layout: false });
});

app.get("/login", function (req, res) {
  res.render("login", { user: req.session.user, layout: false });
});

app.post('/loginCheck', async (req, res) => {
  var thisUsername = req.body.username
  var thisPassword = req.body.password
  if (thisPassword.length === 0 || thisUsername.length === 0) {
    res.send('Please Enter Both Fields')
  }
  else {
    const hashedPassword = await bcrypt.hash(thisPassword, 10);

    User.find({
      username: thisUsername
    })
      .exec()
      .then((users) => {

        users = users.map(value => value.toObject());

        if (bcrypt.compareSync(thisPassword, users[0].password)) {
          res.render("dashboard", { user: req.body, layout: false });
        } else {
          res.send('Invalid password')
        }
      })

      req.session.user = {
        username: req.body.fname,
        password: hashedPassword,
        email: req.body.email
      };

  }
});

app.post('/registrationCheck', (req, res) => {
  var password = req.body.password
  if (!regex.test(password)) {
    res.send('Invalid password')
  }
  else {
    const hashedPassword = bcrypt.hash(password, saltRounds, function (err, hash) {

      var newAcc = new User({
        username: req.body.fname,
        password: hashedPassword,
        email: req.body.email
      })

      newAcc.save((err) => {
        if (err) {
          console.log("There was an error saving the user");
        } else {
          console.log("The user was saved to the collection");
        }
      });

    });

    req.session.user = {
      username: req.body.fname,
      password: hashedPassword,
      email: req.body.email
    };

    transporter.sendMail(welcomeMail, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    res.redirect("/dashboard");

  }
});

app.get("/dashboard", ensureLogin, (req, res) => {
  res.render("dashboard", { user: req.session.user, layout: false });

});

app.post('/dashboard', upload.single('file'), (req, res) => {

  const tempPath = req.file.path;
  let databaseName = String(Date.now()) + path.extname(req.file.originalname)
  var imagename = path.join(__dirname, "./uploads/" + databaseName);

  saveImage(req, imagename);

  var parm1 = {
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    location: req.body.location,
    filename: databaseName
  }

  var newListing = new Listing(parm1)

  newListing.save((err) => {
    if (err) {
      console.log("There was an error saving the listing");
    } else {
      console.log("The listing was saved to the collection");
    }
  });

  res.send('Hello World')

});

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

function saveImage(req, filename) {
  const tempPath = req.file.path;
  const targetPath = filename;

  fs.rename(tempPath, targetPath, function (err, result) {
    if (err) console.log('error', err);
  });

};

app.post('/search', async function (req, res) {
  var title = ''
  var description = ''
  var price = ''
  var rooms = ''
  var thisLocation = req.body.city

  await Listing.find({
    location: thisLocation
  })
    .exec()
    .then((listing) => {

      listing = listing.map(value => value.toObject());

      for (var i = 0; i < listing.length; ++i) {
        filename = listing[i].filename
        title = listing[i].title
        description = listing[i].description
        price = listing[i].price

        rooms += '<div class="listing"><a href="details/?uniqueId=' + filename
          + '"><div class="image">'
          + '<img src="img/' + filename
          + '"></div></a>'
          + '<div class="title">' + title
          + '</div>'
          + '<div class="desc">' + description
          + '</div>'
          + '<div class="rate">' + price
          + ' CAD/night</div></div>'
      }
    })
  res.render("listings", { rooms, layout: false });
})

app.get("/details", async function (req, res) {
  var file = req.query.uniqueId
  var listingAtZero

  await Listing.find({
    filename: file
  })
    .exec()
    .then((listing) => {

      listing = listing.map(value => value.toObject());
      listingAtZero = listing[0]

    })

  res.render("details", { listingAtZero, layout: false })
})

app.post ("/booking", ensureLogin, function(req, res) {
  
  console.log(req.body.email)
  var bookingMail = {
    from: 'airbnb@gmail.com',
    to: req.session.user.email,
    subject: 'Room Booked',
    text: 'Booked Listing Title:' + req.body.title + " Price: " + req.body.description + " Price: " + req.body.price
  };

  transporter.sendMail(bookingMail, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  res.redirect("/listings");
})

// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT, onHttpStart);