const express = require('express');
const { createUser, handleLogin, getUser,
    getAccount
} = require('../controllers/userController');
const auth = require('../middleware/auth');
const delay = require('../middleware/delay');
const productRoutes = require('./productRoutes');
const bannerRoutes = require('./bannerRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');

const routerAPI = express.Router();

// Public routes for products & banners
routerAPI.use('/products', productRoutes);
routerAPI.use('/banners', bannerRoutes);

// Protected routes for cart
routerAPI.use('/cart', cartRoutes);

// Protected routes for orders
routerAPI.use('/orders', orderRoutes);

routerAPI.use(auth);

routerAPI.get("/", (req, res) => {
    return res.status(200).json("Hello world api")
})

routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);

routerAPI.get("/user", getUser);
routerAPI.get("/account", delay, getAccount);

module.exports = routerAPI; //export default