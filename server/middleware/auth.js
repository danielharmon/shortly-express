const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) {
    return models.Sessions.create()
      .then((response) => {
        return models.Sessions.get({ id: response.insertId });
      })
      .then((session) => {
        req.session = session;
        res.cookie('shortlyid', session.hash);
        next();
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    return models.Sessions.get({ hash: req.cookies.shortlyid }).then(
      (session) => {
        if (session) {
          req.session = session;
          next();
        } else {
          return models.Sessions.create()
            .then((response) => {
              return models.Sessions.get({ id: response.insertId });
            })
            .then((session) => {
              req.session = session;
              res.cookie('shortlyid', session.hash);
              next();
            })
            .catch((err) => {
              console.log(err);
            });
        }
      }
    );
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
