const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const parseCookies = require('./middleware/cookieParser');
const verifySession = require('./middleware/verifySession');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(parseCookies);
app.use(Auth.createSession);

app.get('/', verifySession, (req, res) => {
  if (!req.isLoggedIn) {
    return res.redirect('/login' + '?error=Must+be+logged+in');
  }
  res.render('index');
});

app.get('/create', verifySession, (req, res) => {
  if (!req.isLoggedIn) {
    return res.redirect('/login' + '?error=Must+be+logged+in');
  }
  res.render('index');
});

app.get('/links', verifySession, (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect('/login' + '?error=Must+be+logged+in');
  }
  models.Links.getAll()
    .then((links) => {
      res.status(200).send(links);
    })
    .error((error) => {
      res.status(500).send(error);
    });
});

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then((link) => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then((title) => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin,
      });
    })
    .then((results) => {
      return models.Links.get({ id: results.insertId });
    })
    .then((link) => {
      throw link;
    })
    .error((error) => {
      res.status(500).send(error);
    })
    .catch((link) => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', (req, res) => {
  if (!req.query.error) {
    res.render('login', {
      message: 'Welcome User. Please log in',
    });
  } else {
    res.render('login', {
      message: req.query.error,
    });
  }
});

app.post('/login', (req, res) => {
  return models.Users.get({ username: req.body.username })
    .then((response) => {
      if (response) {
        const userValid = models.Users.compare(
          req.body.password,
          response.password,
          response.salt
        );
        if (userValid) {
          models.Sessions.update(
            { hash: req.cookies.shortlyid },
            { userId: response.id }
          ).then(() => {
            return res.redirect('/');
          });
        } else {
          req.error = { error: 'Invalid credentials' };
          return res.redirect('/login/' + '?error=Invalid+Credentials');
        }
      } else {
        req.error = { error: 'Invalid credentials' };
        return res.redirect('/login/' + '?error=Invalid+Credentials');
      }
    })
    .catch((err) => {
      //res.status(500).json({ message: 'Internal server error' });
      console.log('ERROR BLOCK HIT', err);
    });
});

app.get('/signup', (req, res) => {
  if (!req.query.error) {
    res.render('signup', { message: 'Sign Up Today!' });
  } else {
    res.render('signup', { message: req.query.error });
  }
});

app.post('/signup', (req, res) => {
  models.Users.get({ username: req.body.username })
    .then((user) => {
      if (user) {
        return res.redirect('/signup' + '?error=Already+a+User+by+that+Name');
      }
      return models.Users.create({
        username: req.body.username,
        password: req.body.password,
      });
    })
    .then((response) => {
      models.Sessions.update(
        { hash: req.session.hash },
        { userId: response.insertId }
      );
      return res.redirect('/');
    })
    .catch((err) => console.log(err));
});

app.get('/logout', (req, res) => {
  models.Sessions.delete({ hash: req.session.hash })
    .then(() => {
      res.clearCookie('shortlyid');
      res.redirect('/login');
    })
    .catch((err) => {
      console.log(err);
    });
});

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {
  return models.Links.get({ code: req.params.code })
    .tap((link) => {
      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap((link) => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error((error) => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
