// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");

async function registerUser(req, res) {
  const { userId, deviceId, name, phone, password, availCoins, isPrime } =
    req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ userId: userId }, { phone: phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with the provided userId or phone",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        userId,
        deviceId,
        name,
        phone,
        password: hashedPassword,
        availCoins,
        isPrime,
      },
    });

    return res.status(201).json({ message: "Success", newUser });
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Error occured", error: error.message });
  }
}

async function login(req, res) {
  const { userId, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { userId },
      include: {
        joinedRooms: {
          include: {
            room: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const accessToken = jwt.sign(
      { userId: user.userId },
      process.env.ACCESS_TOKEN_SECRET
    );
    return res.json({ message: "Success", token: accessToken, user });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
}

module.exports = { registerUser, login };
