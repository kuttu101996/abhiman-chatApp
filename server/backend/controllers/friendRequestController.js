const prisma = require("../config/db");

const sendFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    // Check if the receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: parseInt(receiverId) },
    });

    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    // Check if a friend request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
      },
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Create a new friend request
    const newFriendRequest = await prisma.friendRequest.create({
      data: {
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
      },
    });

    res.status(201).json(newFriendRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { sendFriendRequest };
