module.exports = (req, res, next) => {
    if (req.session.adminlogined) {
        next()
    } else {
        res.redirect("/dr-admin");
    }
}