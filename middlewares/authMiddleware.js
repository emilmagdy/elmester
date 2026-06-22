// Middleware to protect the route from unautherized  users
const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    } else {
        req.flash("error_msg", "برجاء تسجيل الدخول اولا")
        res.redirect("/login")
    };
};

module.exports = requireAuth;