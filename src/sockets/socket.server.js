const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const userModel = require("../models/user.model");

const intiSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  // Authenticate user from cookie
  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.request.headers.cookie || "");
    if (!cookies.token)
      return next(new Error("Authentication error: no token"));

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) return next(new Error("Authentication error: user not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`${socket.user.fullName} connected (${socket.id})`);

    // Handle sending a message
    socket.on("sendMessage", async ({ chatId, content }) => {
      if (!chatId || !content) {
        return socket.emit("errorMessage", {
          message: "chatId and content are required",
        });
      }

      try {
        // Verify that chat exists and user is a participant
        const chat = await Chat.findOne({
          _id: chatId,
          partcipants: { $in: [socket.user._id] },
        });

        if (!chat) {
          return socket.emit("errorMessage", {
            message: "Invalid chat or access denied",
          });
        }

        // Save the message in the database
        const message = await Message.create({
          chatId,
          sender: socket.user._id,
          content,
        });

        // Populate sender info
        const populatedMessage = {
          ...message._doc,
          sender: {
            _id: socket.user._id,
            fullName: socket.user.fullName,
            profileImage: socket.user.profileImage,
          },
        };

        // Find the other participant to send the message directly
        const receiver = chat.partcipants.find(
          (id) => id.toString() !== socket.user._id.toString()
        );

        // Emit message only to sender and receiver sockets
        // Send to sender (for message acknowledgment)
        socket.emit("receiveMessage", { message: populatedMessage });

        // Send to receiver (if connected)
        // Loop through all connected sockets to find receiver
        for (let [id, s] of io.sockets.sockets) {
          if (s.user && s.user._id.toString() === receiver.toString()) {
            s.emit("receiveMessage", { message: populatedMessage });
            break;
          }
        }

        console.log(
          `Message from ${socket.user.fullName} → sent to chat ${chatId}`
        );
      } catch (err) {
        console.error("Socket message error:", err.message);
        socket.emit("errorMessage", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`${socket.user.fullName} disconnected (${socket.id})`);
    });
  });
};

module.exports = { intiSocketServer };
