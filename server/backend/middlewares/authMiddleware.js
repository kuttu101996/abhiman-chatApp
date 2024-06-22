const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
require("dotenv").config();

const authMiddleware = async function (req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    (req.headers.authorization.startsWith("bearer") ||
      req.headers.authorization.startsWith("Bearer"))
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      if (!token) {
        return res.status(401).json({ error: "Access token is missing" });
      }

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId },
        select: {
          id: true,
          userId: true,
          deviceId: true,
          name: true,
          phone: true,
          availCoins: true,
          isPrime: true,
          createdRooms: true,
          messages: true,
          friendRequestsSent: true,
          friendRequestsReceived: true,
          totalRoomJoined: true,
          joinedRooms: true,
          invites: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error(error.message);
      return res.status(401).json({
        message: "Not authorized, token failed",
        error: error.message,
      });
    }
  }
};

module.exports = { authMiddleware };
