const express = require("express");
const messageRouter = express.Router();

const { getMessagesByRoom } = require("../controllers/messageController");
const { authMiddleware } = require("../middlewares/authMiddleware");

messageRouter.get("/room/:id", authMiddleware, getMessagesByRoom);

module.exports = messageRouter;
