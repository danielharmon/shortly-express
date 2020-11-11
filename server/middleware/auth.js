const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  //look for a cookie key
  //if it doesn't exist, create one and store it
  //if it does exist, verify it
  models.Users.get({ username: req.body.username })
    .then((user) => {
      console.log(user);
      models.Sessions.create();
      next();
    })
    .catch((err) => {
      throw err;
    });
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/
