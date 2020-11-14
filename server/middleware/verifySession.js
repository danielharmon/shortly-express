const model = require('../models');

const verifySession = (req, res, next) => {
  if (model.Sessions.isLoggedIn(req.session)) {
    req.isLoggedIn = true; // For testing purposes
    next();
  } else {
    req.isLoggedIn = false;
    next();
  }
};

module.exports = verifySession;
