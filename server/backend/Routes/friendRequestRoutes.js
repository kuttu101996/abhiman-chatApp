const express = require("express");
const { sendFriendRequest } = require("../controllers/friendRequestController");
const { authMiddleware } = require("../middlewares/authMiddleware");

const friendsRouter = express.Router();

friendsRouter.post("/friend-requests", authMiddleware, sendFriendRequest);

module.exports = friendsRouter;
