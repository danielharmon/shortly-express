const parseCookies = (req, res, next) => {
  req.cookies = {};

  if (req.headers.cookie) {
    const cookieString = req.headers.cookie;

    const cookiesArray = cookieString.split('; ');
    const cookiesHashTable = cookiesArray.map((cookie) => cookie.split('='));

    cookiesHashTable.forEach((pair) => {
      req.cookies[pair[0]] = pair[1];
    });
  }
  next();
};

module.exports = parseCookies;
