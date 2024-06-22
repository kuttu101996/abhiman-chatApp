const express = require("express");
require("dotenv").config();
const cors = require("cors");
const colors = require("colors");

const prisma = require("./config/db");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const authRouter = require("./Routes/authRoutes");
const chatRouter = require("./Routes/chatRoutes");
const userRoutes = require("./Routes/userRoutes");
const messageRouter = require("./Routes/messageRoutes");
const friendsRouter = require("./Routes/friendRequestRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/friends", friendsRouter);

app.get("/", (req, res) => {
  return res.send("Hello From Server");
});

app.use(notFound);
app.use(errorHandler);

const server = app.listen(process.env.port, async () => {
  try {
    await prisma.$connect();
    console.log("DB Connected".cyan.underline);
    console.log(`server running at ${process.env.port}`.cyan.underline);
  } catch (error) {
    console.log(error.message);
    process.exit(1); // Exit the process with a failure code
  }
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "https://abhiman-chat-app.netlify.app",
  },
});

io.on("connection", (socket) => {
  socket.on("setup", (userData) => {
    socket.join(userData?.id);
    socket.emit("connected");
  });

  socket.on("joinChat", (room) => {
    socket.join(room);
  });

  socket.on("typing", (room) => io.in(room).emit("typing"));
  socket.on("stopTyping", (room) => io.in(room).emit("stopTyping"));

  socket.on("newMessage", async (newMessage) => {
    const { roomId, userId, message } = newMessage;
    // console.log(roomId, userId, message);
    try {
      const parsedRoomId = parseInt(roomId);
      const parsedUserId = parseInt(userId);

      if (isNaN(parsedRoomId) || isNaN(parsedUserId)) {
        throw new Error("Invalid roomId or userId");
      }
      const savedMessage = await prisma.message.create({
        data: {
          roomId: parsedRoomId,
          userId: parsedUserId,
          message,
        },
        include: {
          user: true,
        },
      });

      io.in(roomId).emit("messageRcv", savedMessage);
    } catch (error) {
      console.error(error.message);
    }
  });

  socket.off("setup", () => {
    console.log("User Disconnected");
    socket.leave(userData._id);
  });
});
