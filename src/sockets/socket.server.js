const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const userModel = require("../models/user.model");

const intiSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.request.headers.cookie || "");

    if (!cookies.token) {
      return next(new Error("Authentication error: no token"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("a user connected with id: " + socket.id);

    socket.on("message", (msg) => {
      console.log("message: " + msg);

      io.emit("response", {
        message: "received your message in Server.",
      });
    });

    socket.on("disconnect", () => {
      console.log("user disconnected with id: " + socket.id);
    });
  });
};

module.exports = {
  intiSocketServer,
};
