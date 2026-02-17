const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

// ✅ Your admin UID
const ADMIN_UIDS = ["61585966465927"]; // Only this UID can use the command

module.exports = {
  config: {
    name: "fuck",
    aliases: ["fck"],
    version: "3.2",
    author: "MOHAMMAD AKASH",
    countDown: 5,
    role: 1, // Only admins
    description: "Overlay two users’ avatars on an NSFW image template (fun only)",
    category: "fun",
  },

  onStart: async function ({ message, event }) {
    try {
      // 🚫 Only allow UIDs in ADMIN_UIDS
      if (!ADMIN_UIDS.includes(event.senderID)) {
        return message.reply("⚠️ Only admins can use this command! 🤌");
      }

      let targetID;
      const mention = Object.keys(event.mentions || {});

      if (mention.length > 0) {
        targetID = mention[0];
      } else if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else {
        return message.reply("⚠️ Please mention or reply to 1 person!");
      }

      const one = event.senderID;
      const two = targetID;

      const dir = path.join(__dirname, "cache");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const bgPath = path.join(dir, "fuck_template.png");

      if (!fs.existsSync(bgPath)) {
        const img = await axios.get(
          "https://i.ibb.co/VJHCjCb/images-2022-08-14-T183802-542.jpg",
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(bgPath, Buffer.from(img.data));
      }

      const avatar1 = path.join(dir, `${one}.png`);
      const avatar2 = path.join(dir, `${two}.png`);

      const getAvatar = async (id, savePath) => {
        const avatar = await axios.get(
          `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(savePath, Buffer.from(avatar.data));
      };

      await getAvatar(one, avatar1);
      await getAvatar(two, avatar2);

      const bg = await loadImage(bgPath);
      const av1 = await loadImage(avatar1);
      const av2 = await loadImage(avatar2);

      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(bg, 0, 0, bg.width, bg.height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 450, 80, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(av1, 40, 370, 160, 160);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(520, 200, 80, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(av2, 440, 120, 160, 160);
      ctx.restore();

      const outPath = path.join(dir, `fuck_result_${one}_${two}.png`);
      fs.writeFileSync(outPath, canvas.toBuffer("image/png"));

      await message.reply({
        body: "💥 Here you go!",
        attachment: fs.createReadStream(outPath),
      });

      fs.unlinkSync(avatar1);
      fs.unlinkSync(avatar2);
      fs.unlinkSync(outPath);

    } catch (err) {
      console.error(err);
      return message.reply(`❌ Error while generating image: ${err.message}`);
    }
  },
};
