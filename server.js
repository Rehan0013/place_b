require("dotenv").config();
const { createServer } = require("http");

const app = require("./src/app");
const connectDB = require("./src/db/db")
const { intiSocketServer } = require("./src/sockets/socket.server");

const httpServer = createServer(app);

intiSocketServer(httpServer);


const PORT = process.env.PORT || 5003;

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

connectDB();