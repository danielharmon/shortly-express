const parseCookies = (req, res, next) => {
  if (req.headers.cookie) {
    const cookieString = req.headers.cookie;

    const cookiesArray = cookieString.split('; ');
    const cookiesHashTable = cookiesArray.map((cookie) => cookie.split('='));

    const cookieObj = {};

    cookiesHashTable.forEach((pair) => {
      cookieObj[pair[0]] = pair[1];
    });

    req.cookies = cookieObj;
  }
  next();
};

module.exports = parseCookies;
