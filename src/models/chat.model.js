const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    partcipants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const chatModel = mongoose.model("chat", chatSchema);

module.exports = chatModel;
