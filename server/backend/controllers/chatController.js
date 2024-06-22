const prisma = require("../config/db");
require("dotenv").config();
const jwt = require("jsonwebtoken");

async function createChatRoom(req, res) {
  const { roomId } = req.body;
  const userId = req.user.id;

  if (!roomId) {
    return res.status(400).json({ error: "Room ID is required" });
  }

  try {
    if (!req.user.isPrime) {
      return res
        .status(403)
        .json({ error: "Only prime members can create chat rooms" });
    }

    const existingRoom = await prisma.room.findUnique({
      where: { roomId },
    });

    if (existingRoom) {
      return res.send({ message: "RoomID exists" });
    }

    const newRoom = await prisma.room.create({
      data: {
        roomId,
        creator: {
          connect: { id: req.user.id },
        },
        users: {
          create: {
            user: {
              connect: { id: req.user.id },
            },
          },
        },
        chats: [],
      },
      include: {
        creator: true,
        users: true,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        totalRoomJoined: req.user.totalRoomJoined + 1,
      },
    });

    return res.status(201).json({ message: "Success", newRoom });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

const getJoinedRooms = async (req, res) => {
  try {
    const joinedRooms = await prisma.user.findUnique({
      where: { userId: req.user.userId },
      include: {
        joinedRooms: {
          include: {
            room: true,
          },
        },
      },
    });

    return res.status(200).json({ message: "Success", data: joinedRooms });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .send({ message: "Server Error", error: err.message });
  }
};

const inviteToRoom = async (req, res) => {
  const { roomId, invitedUserId } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: { users: true },
    });

    if (!room) return res.send({ message: "Chat Room Not Found" });

    if (room.users.length >= 6) {
      return res.status(400).json({ error: "Room capacity is full" });
    }

    const invitee = await prisma.user.findUnique({
      where: { userId: invitedUserId },
    });

    if (!invitee) {
      return res.status(404).json({ error: "Invitee not found" });
    }

    if (invitee.invites.length) {
      const alreadyInvited = invitee.invites.map((invite) =>
        invite.roomId === roomId ? true : false
      );

      if (alreadyInvited) {
        return res
          .status(201)
          .json({ message: "User already gets an invitation for this room" });
      }
    }

    const inviteToken = jwt.sign(
      { roomId, invitedUserId },
      process.env.INVITE_SECRET,
      { expiresIn: "2h" }
    );

    const updatedInvites = [
      ...invitee.invites,
      {
        token: inviteToken,
        createdAt: new Date(),
        roomId: roomId,
        creatorId: req.user.userId,
      },
    ];
    await prisma.user.update({
      where: { id: parseInt(invitee.id) },
      data: { invites: updatedInvites },
    });

    return res.status(200).send({ message: "Success", inviteToken });
  } catch (err) {
    console.error(err.message);
    return res
      .status(500)
      .send({ message: "Server Error", error: err.message });
  }
};

const joinRoom = async (req, res) => {
  const { roomId } = req.body;

  try {
    const room = await prisma.room.findUnique({
      where: { roomId },
      include: { users: true },
    });

    if (!room) {
      return res.status(404).send({ message: "Room not found" });
    }

    if (room.users.length >= 6) {
      return res.status(400).json({ error: "Room capacity is full" });
    }

    const isAlreadyMember = room.users.some(
      (roomUser) => roomUser.userId === req.user.id
    );
    if (isAlreadyMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of the room" });
    }

    if (req.user.availCoins < 150 && req.user.isPrime === false) {
      return res.status(403).send({ message: "Insufficient coins" });
    }

    let filteredInvites = req.user.invites.filter(
      (invite) => invite.roomId !== roomId
    );

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        availCoins: req.user.isPrime
          ? req.user.availCoins
          : req.user.availCoins - 150,
        totalRoomJoined: req.user.totalRoomJoined + 1,
        invites: filteredInvites,
      },
    });

    await prisma.roomUser.create({
      data: {
        userId: req.user.id,
        roomId: room.id,
      },
    });

    res.status(200).json({
      message: "Success",
      additionalMessage: "User joined the room successfully",
    });
  } catch (err) {
    console.log(err.message);
    return res
      .status(500)
      .send({ message: "Server Error", error: err.message });
  }
};

const getRoom = async (req, res) => {
  const { roomId } = req.body;
  try {
    const rooms = await prisma.room.findMany({
      where: { roomId },
      include: { users: { select: { user: true } } },
    });

    return res.status(200).json({ message: "All Rooms", data: rooms });
  } catch (err) {
    console.log(err.message);
    return res
      .status(500)
      .send({ message: "Error occured", error: err.message });
  }
};

module.exports = {
  createChatRoom,
  getJoinedRooms,
  inviteToRoom,
  joinRoom,
  getRoom,
};
