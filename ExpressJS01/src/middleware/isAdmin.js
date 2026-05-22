const isAdmin = (req, res, next) => {
    console.log(">>> isAdmin check:", req.user);
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            message: "Forbidden: Bạn không có quyền Admin"
        });
    }
};

module.exports = isAdmin;
