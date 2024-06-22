const prisma = require("../config/db");

const getMessagesByRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const messages = await prisma.message.findMany({
      where: { roomId: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            userId: true,
            phone: true,
            deviceId: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: "asc" },
    });

    res.status(200).json({ message: "Success", data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { getMessagesByRoom };
