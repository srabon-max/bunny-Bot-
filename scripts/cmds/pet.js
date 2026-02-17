const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pet",
    version: "1.1",
    author: "nexo|fixed by kabir",
    countDown: 5,
    role: 0,
    shortDescription: "Pet a user",
    longDescription: "Generates a pet image/video for a tagged or replied user",
    category: "fun",
    guide: "{p}pet @user / reply + {p}pet"
  },

  onStart: async function ({ message, event, usersData }) {
    let userid;

    // 1️⃣ mention থাকলে সেটাই নিবে
    const mentions = Object.keys(event.mentions || {});
    if (mentions.length > 0) {
      userid = mentions[0];
    }
    // 2️⃣ mention না থাকলে reply করা message এর sender নিবে
    else if (event.messageReply) {
      userid = event.messageReply.senderID;
    }
    // 3️⃣ দুটোই না থাকলে
    else {
      return message.reply("❌ কাউকে mention করো বা message এ reply দাও।");
    }

    const apiUrl = `https://betadash-api-swordslush-production.up.railway.app/pet?userid=${userid}`;

    try {
      const res = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const contentType = res.headers["content-type"] || "";

      const ext = contentType.includes("gif")
        ? "gif"
        : contentType.includes("mp4")
        ? "mp4"
        : "jpg";

      const filePath = path.join(__dirname, "cache", `pet_${userid}.${ext}`);
      fs.writeFileSync(filePath, res.data);

      const name = await usersData.getName(userid);

      await message.reply({
        body: `🐾 You petted ${name}!`,
        attachment: fs.createReadStream(filePath)
      });

      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("❌ Pet command error:", err);
      message.reply("⚠️ Failed to generate pet image/video.");
    }
  }
};
