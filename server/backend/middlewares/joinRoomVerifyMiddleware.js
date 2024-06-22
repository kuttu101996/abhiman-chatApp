const jwt = require("jsonwebtoken");
require("dotenv").config();

const joinRoomVerificationMiddleware = async function (req, res, next) {
  let token = req.body.joinRoomToken;

  try {
    if (!token) {
      return res
        .status(401)
        .json({ error: "Access token for joining the room is missing" });
    }

    const decoded = jwt.verify(token, process.env.INVITE_SECRET);
    userMatch = decoded.invitedUserId === req.user.userId;
    roomIdMatch = decoded.roomId === req.body.roomId;

    if (!userMatch) {
      return res.status(404).json({
        message: "Not authorized, invitation token required to join a room",
      });
    }
    next();
  } catch (error) {
    if (error.message === "jwt expired") {
      return res.status(401).json({
        message: "Invitation token expired",
        error: error.message,
      });
    }
    return res
      .status(401)
      .json({ message: "Not authorized, token failed", error: error.message });
  }
};

module.exports = { joinRoomVerificationMiddleware };
