const model = require('../models');

const verifySession = (req, res, next) => {
  if (model.Sessions.isLoggedIn(req.session)) {
    next();
  } else {
    res.redirect('/login');
  }
};

module.exports = verifySession;
