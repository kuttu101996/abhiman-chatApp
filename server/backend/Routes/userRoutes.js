const express = require("express");
const {
  getUserProfile,
  deleteUser,
  getUsers,
  searchUser,
} = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const userRoutes = express.Router();

userRoutes.get("/all-user", authMiddleware, getUsers);
userRoutes.get("/search-user", authMiddleware, searchUser);
userRoutes.get("/profile/:id", authMiddleware, getUserProfile);
userRoutes.delete("/delete/:id", authMiddleware, deleteUser);

module.exports = userRoutes;
