// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  res.redirect("/");
};

module.exports = {
  isAuthenticated,
};

module.exports = {
  isAuthenticated,
};
