const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "spiderman",
    aliases: ["spiderman"],
    version: "1.0",
    author: "zach",
    countDown: 5,
    role: 0,
    shortDescription: "memes",
    longDescription: "",
    category: "photo",
    guide: ""
  },

  onStart: async function ({ message, event }) {

    let one, two;
    const mentions = Object.keys(event.mentions || {});

    // reply support
    if (mentions.length === 0 && event.messageReply) {
      one = event.senderID;
      two = event.messageReply.senderID;
    }
    // single mention
    else if (mentions.length === 1) {
      one = event.senderID;
      two = mentions[0];
    }
    // double mention
    else if (mentions.length >= 2) {
      one = mentions[1];
      two = mentions[0];
    }
    else {
      return message.reply("mention or reply someone");
    }

    const path = await bal(one, two);
    return message.reply({
      body: mentions.length >= 2 ? "he is not me🕸️" : "it's him🕸️",
      attachment: fs.createReadStream(path)
    });
  }
};

async function bal(one, two) {
  let avone = await jimp.read(
    `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  avone.circle();

  let avtwo = await jimp.read(
    `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  avtwo.circle();

  let pth = "spiderman.png";
  let img = await jimp.read("https://i.imgur.com/AIizK0f.jpeg");

  img
    .resize(1440, 1080)
    .composite(avone.resize(170, 170), 325, 110)
    .composite(avtwo.resize(170, 170), 1000, 95);

  await img.writeAsync(pth);
  return pth;
}
