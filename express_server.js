var express = require("express");
// var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session')

const bcrypt = require('bcryptjs');
var app = express();

// app.use(cookieParser());
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

var app = express()

app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));


function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

var urlDatabase = {
  "b2xVn2": {url: "http://www.lighthouselabs.ca", userID: "userRandomID"},
  "9sm5xK": {url: "http://www.google.com", userID: "user2RandomID"},
};

// urlDatabase.shortURL.userID = req.cookies.user_id

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
   "a": {
    id: "a",
    email: "a@g",
    password: "a"
  }
};

var testEmail = function (email) {
  for(key in users) {
    console.log(users[key]["email"])
    if (users[key]["email"] == email) {
      return true
    }
    return
  }
}

var testPassword = function (password) {
  for(key in users) {
    console.log(users[key]["password"])
  }
    return (users[key]["password"] === password)
}

var userLogin = function (email, password) {
  for(key in users) {
    if ( bcrypt.compareSync(password, users[key]["password"]) && (users[key]["email"] === email) ) {
      return true;
    }
  }
  return false;
}



var retrieveUserId = function (email, password) {
  for(key in users) {
    if (bcrypt.compareSync(password, users[key]["password"]) && users[key]['email'] == email) {
      console.log('user has been found' , users[key])
      var user_id = users[key]['id']
      return user_id
    }
  }
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  key = req.session.user_id
  var urls = {};
  for (var newkey in urlDatabase) {
    if (key === urlDatabase[newkey].userID) {
     urls[newkey] = urlDatabase[newkey];
    }
  };
  // console.log("/urls", req.cookies)
  let templateVars = {
    urls: urls,
    user: users[key]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/register", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
  };
  res.render("urls_registration", templateVars);
});

app.get("/urls/login", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
  res.render("urls_login", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  };
    if(templateVars.user === undefined) {
    res.redirect('/urls/login')
  } else {
    res.render("urls_new", templateVars);
  }

});



app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id]["url"],
    user: users[req.session.user_id],
  };
  res.render("urls_show", templateVars);
});


// this is for /new

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  let longURL = urlDatabase[req.params.shortURL];

  urlDatabase[shortURL] = {}
  urlDatabase[shortURL]['url'] = req.body.longURL;
  urlDatabase[shortURL]['userID'] = req.session.user_id
  console.log(urlDatabase);
  console.log(req.body)
  res.redirect('/urls');
});



app.post("/register", (req, res) => {
  var newId = generateRandomString();
  var foundEmail = testEmail(req.body.email)

  if(req.body.email.length === 0 || req.body.password.length === 0) {
  res.status(400).send('error : email and password can not be empty')
  } else if(foundEmail == true) {
      res.status(400).send('error : this email is already registered')
    } else {

    users[newId] = {
    id: newId,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  }

    req.session.user_id = newId;
    console.log("database", users )
    res.redirect('/urls');
    }
});


app.post("/login", (req, res) => {
  var userValid = userLogin(req.body.email, req.body.password)
  console.log(userValid)
  if(req.body.email.length === 0 || req.body.password.length === 0) {
  res.status(400).send('error 400 : email and password can not be empty')
  } else if(!userValid) {
    res.status(403).send('error 403 : email or password does not match')
  } else {
    var user_id = retrieveUserId(req.body.email, req.body.password)
    req.session.user_id = user_id;
    res.redirect('/urls');
  }
});


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});


app.post("/urls/:shortURL/update", (req, res) => {
  urlDatabase[req.params.shortURL] = {}
  urlDatabase[req.params.shortURL]['url'] = req.body.longURL;
  urlDatabase[req.params.shortURL]['userID'] = req.session.user_id
  // console.log(urlDatabase);
  res.redirect('/urls');
});


app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});






