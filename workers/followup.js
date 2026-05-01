const User = require("../models/User");
const axios = require("axios");

module.exports = async function runFollowUps() {
  const users = await User.find();

  const now = new Date();

  for (let user of users) {
    const diffMinutes = (now - user.lastInteraction) / 60000;

    if (diffMinutes > 30 && user.stage !== "closed") {
      console.log("Sending follow-up to:", user.senderId);

      await axios.post(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
        {
          recipient: { id: user.senderId },
          message: {
            text: "Hey, just checking in 🙂 Were you still interested in improving your business with AI?",
          },
        }
      );

      user.lastInteraction = new Date();
      await user.save();
    }
  }
};