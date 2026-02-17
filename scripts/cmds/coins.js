
const fs = require("fs");
const path = require("path");
const econFile = path.join(__dirname, "economy.json");

module.exports = {
  config: {
    name: "coins",
    version: "1.1",
    author: "Bunny",
    role: 0,
    shortDescription: "Check your coin balance",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function({ message, event, api }) {
    const uid = event.senderID;

    // Load economy safely
    let economy = {};
    if(fs.existsSync(econFile)) {
      economy = JSON.parse(fs.readFileSync(econFile));
    }

    // Initialize user safely
    if(!economy[uid]) economy[uid] = {};
    if(!economy[uid].coins) economy[uid].coins = 0;
    if(!economy[uid].items || !Array.isArray(economy[uid].items)) economy[uid].items = [];
    if(!economy[uid].activeEffects || typeof economy[uid].activeEffects !== "object") economy[uid].activeEffects = {};

    // Save back updated structure
    fs.writeFileSync(econFile, JSON.stringify(economy, null, 2));

    // Show coin balance
    const coins = economy[uid].coins;
    const items = economy[uid].items.length ? economy[uid].items.join(", ") : "No items";

    const reply = `
💰 Coin Balance: ${coins} coins
🎁 Items: ${items}
`;

    return message.reply(reply);
  }
};
