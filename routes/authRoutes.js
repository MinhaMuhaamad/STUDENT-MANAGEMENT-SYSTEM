const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const User = require("../models/User");

// Changed from / to /login for the login page route
router.get("/login", authController.getLoginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
