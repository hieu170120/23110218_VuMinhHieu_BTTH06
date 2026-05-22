require("dotenv").config();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const saltRounds = 10;

// Hàm xử lý đăng ký người dùng
const createUserService = async (name, email, password) => {
    try {
        // 1. Kiểm tra xem user đã tồn tại chưa
        const user = await User.findOne({ email });
        if (user) {
            console.log(`>>> user exist, chọn 1 email khác: ${email}`);
            return null;
        }

        // 2. Mã hóa mật khẩu (Hash password)
        const hashPassword = await bcrypt.hash(password, saltRounds);

        // 3. Lưu thông tin người dùng vào database
        let result = await User.create({
            name: name,
            email: email,
            password: hashPassword,
            role: "User"
        })
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}

// Hàm xử lý đăng nhập
const loginService = async (email1, password) => {
    try {
        // 1. Tìm người dùng theo email
        const user = await User.findOne({ email: email1 });
        if (user) {
            // 2. So sánh mật khẩu nhập vào với mật khẩu đã mã hóa trong DB
            const isMatchPassword = await bcrypt.compare(password, user.password);
            if (!isMatchPassword) {
                return {
                    EC: 2,
                    EM: "Email/Password không hợp lệ"
                }
            } else {
                // 3. Tạo Access Token (JWT)
                const payload = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }

                const access_token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    {
                        expiresIn: process.env.JWT_EXPIRE
                    }
                )

                return {
                    EC: 0,
                    access_token,
                    user: {
                        email: user.email,
                        name: user.name,
                        role: user.role
                    }
                }
            }
        } else {
            return {
                EC: 1,
                EM: "Email/Password không hợp lệ"
            }
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Hàm lấy danh sách người dùng (ẩn mật khẩu)
const getUserService = async () => {
    try {
        let result = await User.find({}).select("-password");
        return result;

    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports = {
    createUserService,
    loginService,
    getUserService
}