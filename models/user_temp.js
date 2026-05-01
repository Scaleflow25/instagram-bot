const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  senderId: String,
  name: String,
  lastMessage: String,
  lastInteraction: { type: Date, default: Date.now },
  stage: { type: String, default: "new" }, // new, interested, closed
});

module.exports = mongoose.model("User", userSchema);