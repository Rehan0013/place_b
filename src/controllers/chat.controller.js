const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");

// Get or create a one-on-one chat between two users
const getOrCreateChat = async (req, res) => {
  const userId = req.user._id;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    return res
      .status(400)
      .json({ success: false, message: "otherUserId is required" });
  }

  try {
    // Check if chat already exists between these two users
    let chat = await Chat.findOne({
      partcipants: { $all: [userId, otherUserId], $size: 2 },
    }).populate("partcipants", "fullName email profileImage");

    if (!chat) {
      // Create new chat if it doesn't exist

      const otherUser = await User.findOne({ otherUserId });

      if (!otherUser) {
        return res.status(500).json({
          success: "false",
          message: "User not Found or friend Id is wrong.",
        });
      }

      chat = await Chat.create({ partcipants: [userId, otherUserId] });
    }

    // Fetch all messages for this chat
    const messages = await Message.find({ chatId: chat._id })
      .populate("sender", "fullName email profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      chat,
      messages,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  getOrCreateChat,
};
