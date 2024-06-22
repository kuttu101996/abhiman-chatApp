const prisma = require("../config/db");
const jwt = require("jsonwebtoken");

const removeExpiredInvites = (invites) => {
  return invites.filter((invite) => {
    try {
      const decoded = jwt.verify(invite.token, process.env.INVITE_SECRET);
      return true;
    } catch (err) {
      return false;
    }
  });
};

// const getUserWithValidInvites = async (userId) => {};

exports.getUserProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    // const user = await getUserWithValidInvites(userId);
    let user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      include: {
        createdRooms: true,
        messages: true,
        friendRequestsSent: true,
        friendRequestsReceived: true,
      },
    });

    const validInvites = removeExpiredInvites(user.invites);

    if (validInvites.length !== user.invites.length) {
      const aa = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { invites: validInvites },
      });
    }

    user = { ...user, invites: validInvites };

    return res.status(200).json({ message: "Success", data: user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: "Server Error", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Success, user successfullydeleted deleted", user });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ error: "Internal server error", error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const allUser = await prisma.user.findMany({
      include: {
        joinedRooms: {
          include: {
            room: true,
          },
        },
      },
    });
    return res.status(201).json({ message: "Success", allUser });
  } catch (error) {
    console.error(error.message);
    return res
      .status(500)
      .json({ message: "Error occured", error: error.message });
  }
};

exports.searchUser = async function (req, res) {
  const keyword = req.query.search;
  const loggedInUserId = req.user.userId;
  const loggedInUserPhone = req.user.phone;

  try {
    if (keyword && keyword.length) {
      const existingUsers = await prisma.user.findMany({
        where: {
          AND: [
            {
              OR: [
                { userId: { contains: keyword } },
                { phone: { contains: keyword } },
              ],
            },
            {
              userId: {
                not: loggedInUserId,
              },
            },
            {
              phone: {
                not: loggedInUserPhone,
              },
            },
          ],
        },
      });
      return res.status(201).json({ message: "Result", users: existingUsers });
    }
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "Error occured", error: error.message });
  }
};

// exports.getProfile = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const user = await prisma.user.findUnique({
//       where: { id: parseInt(userId) },
//       include: {
//         createdRooms: true,
//         messages: true,
//         friendRequestsSent: true,
//         friendRequestsReceived: true,
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     return res.status(200).json({ message: "Success", user });
//   } catch (error) {
//     console.error(error.message);
//     return res
//       .status(500)
//       .json({ error: "Error occured", error: error.message });
//   }
// };
