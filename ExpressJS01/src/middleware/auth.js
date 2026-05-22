require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    // Whitelist - những routes không cần auth
    const white_lists = ["/", "/register", "/login"];
    
    const currentPath = '/v1/api' + (req.originalUrl.split('/v1/api')[1] || req.originalUrl);
    
    // Kiểm tra exact match với whitelist
    if (white_lists.find(item => currentPath === '/v1/api' + item)) {
        next();
    } else {
        // Tất cả các route khác đều cần verify token
        if (req.headers?.authorization?.split(' ')?.[1]) {
            const token = req.headers.authorization.split(' ')[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role,
                    _id: decoded._id,
                    createdBy: "hoidanit"
                }
                console.log(">>> check token: ", decoded);
                next();
            } catch (error) {
                return res.status(401).json({
                    message: "Token bị hết hạn hoặc không hợp lệ"
                })
            }
        } else {
            return res.status(401).json({
                message: "Bạn chưa truyền Access Token ở header/Hoặc token bị hết hạn"
            })
        }
    }
}

module.exports = auth;