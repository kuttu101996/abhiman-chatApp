// routes/authRoutes.js
const express = require("express");
const authRouter = express.Router();
const authController = require("../controllers/authController");

authRouter.post("/register", authController.registerUser);
authRouter.post("/login", authController.login);

module.exports = authRouter;
