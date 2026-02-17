
const fs = require("fs");
const path = require("path");
const econFile = path.join(__dirname, "economy.json");

// MysteryBox rewards (coins/items)
const mysteryItems = [
  { name: "Small Coin Pack", coins: 100, type: "coins" },
  { name: "Medium Coin Pack", coins: 250, type: "coins" },
  { name: "Large Coin Pack", coins: 500, type: "coins" },
  { name: "Magic Hat 🎩", type: "item", effect: "doubleRewardNextBox" },
  { name: "Lucky Coin 🍀", type: "item", effect: "bonusCoinsNextBox" }
];

module.exports = {
  config: {
    name: "mysterybox",
    version: "2.0",
    author: "Bunny",
    role: 0,
    shortDescription: "Open a MysteryBox for coins or items",
    category: "fun",
    guide: "{pn}"
  },

  onStart: async function({ message, event }) {
    const uid = event.senderID;

    // Load economy
    let economy = {};
    if(fs.existsSync(econFile)){
      economy = JSON.parse(fs.readFileSync(econFile));
    }

    // Initialize user safely
    if(!economy[uid]) economy[uid] = {};
    if(typeof economy[uid].coins !== "number") economy[uid].coins = 0;
    if(!Array.isArray(economy[uid].items)) economy[uid].items = [];
    if(typeof economy[uid].activeEffects !== "object") economy[uid].activeEffects = {};

    const boxCost = 100;

    // Check coins
    if(economy[uid].coins < boxCost) return message.reply("❌ Not enough coins to open MysteryBox!");

    // Deduct cost
    economy[uid].coins -= boxCost;

    // Random reward
    const reward = mysteryItems[Math.floor(Math.random() * mysteryItems.length)];
    let rewardText = "";

    if(reward.type === "coins") {
      // Apply shop items effect if any
      let coinsToAdd = Number(reward.coins);

      // doubleRewardNextBox effect
      if(economy[uid].activeEffects.doubleRewardNextBox){
        coinsToAdd *= 2;
        economy[uid].activeEffects.doubleRewardNextBox = false; // consume effect
      }

      economy[uid].coins += coinsToAdd;
      rewardText = `💰 You got ${coinsToAdd} coins!`;

    } else if(reward.type === "item") {
      // Add item
      economy[uid].items.push(reward.name);
      economy[uid].activeEffects[reward.effect] = true;
      rewardText = `🎁 You got a special item: ${reward.name}! Effect active: ${reward.effect}`;
    }

    // Save economy
    fs.writeFileSync(econFile, JSON.stringify(economy, null, 2));

    // Show result
    message.reply(`🎉 MysteryBox Opened!\n${rewardText}\n💰 Your coins: ${economy[uid].coins}`);
  }
};
