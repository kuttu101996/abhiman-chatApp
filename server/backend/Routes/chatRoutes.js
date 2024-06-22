const express = require("express");
const chatRouter = express.Router();
const {
  createChatRoom,
  inviteToRoom,
  joinRoom,
  getRoom,
  getJoinedRooms,
} = require("../controllers/chatController");
const {
  joinRoomVerificationMiddleware,
} = require("../middlewares/joinRoomVerifyMiddleware");
const { authMiddleware } = require("../middlewares/authMiddleware");

chatRouter.get("/all-room", getRoom);
chatRouter.get("/joined-rooms", authMiddleware, getJoinedRooms);
chatRouter.post("/create-chatroom", authMiddleware, createChatRoom);
chatRouter.post("/invite", authMiddleware, inviteToRoom);

chatRouter.post(
  "/joinroom",
  authMiddleware,
  joinRoomVerificationMiddleware,
  joinRoom
);

module.exports = chatRouter;
