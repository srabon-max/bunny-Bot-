

const fs = require("fs");
const path = require("path");
const econFile = path.join(__dirname, "economy.json");

// Load economy
let economy = {};
if(fs.existsSync(econFile)) {
  economy = JSON.parse(fs.readFileSync(econFile));
} else {
  fs.writeFileSync(econFile, JSON.stringify({}));
}

// Shop items
const shopItems = [
  { name: "Magic Hat 🎩", price: 200, description: "Next MysteryBox reward x2" },
  { name: "Dragon Pet 🐉", price: 500, description: "Higher chance for Ultra items" },
  { name: "Flying Carpet 🧞", price: 300, description: "Random bonus coins in MysteryBox" },
  { name: "Lucky Coin 🍀", price: 150, description: "Small extra coins in next MysteryBox" },
  { name: "Cursed Crown 👑", price: 700, description: "Unlock secret MysteryBox event" },
  { name: "Time-Travel Watch ⏱️", price: 400, description: "Chance to double MysteryBox reward" },
  { name: "Phoenix Feather 🪶", price: 600, description: "Rare item for special MysteryBox effect" }
];

module.exports = {
  config: {
    name: "shop",
    version: "6.0",
    author: "Bunny",
    role: 0,
    shortDescription: "View and buy items",
    category: "fun",
    guide: "{pn} view | buy <item name>"
  },

  onStart: async function({message, event, api}) {
    const args = event.body.split(/\s+/).slice(1);
    const uid = event.senderID;

    // Initialize user safely
    if(!economy[uid]) economy[uid] = {};
    if(!economy[uid].coins || typeof economy[uid].coins !== "number") economy[uid].coins = 0;
    if(!economy[uid].items || !Array.isArray(economy[uid].items)) economy[uid].items = [];
    if(!economy[uid].activeEffects || typeof economy[uid].activeEffects !== "object") economy[uid].activeEffects = {};

    // View shop
    if(!args[0] || args[0].toLowerCase() === "view"){
      let reply = "🛒 Shop Items:\n\n";
      shopItems.forEach(item => {
        reply += `• ${item.name} - ${item.price} coins\n  ${item.description}\n\n`;
      });
      return message.reply(reply);
    }

    // Buy item
    if(args[0].toLowerCase() === "buy"){
      const itemNameRaw = args.slice(1).join(" ").toLowerCase().trim();

      // Find item safely (includes match + emoji ignore)
      const item = shopItems.find(i =>
        i.name.toLowerCase().replace(/[^\w\s]/gi,'').includes(itemNameRaw.replace(/[^\w\s]/gi,''))
      );

      if(!item) return message.reply("❌ Item not found!");

      // Safe coins check
      const userCoins = Number(economy[uid].coins || 0);
      const itemPrice = Number(item.price || 0);
      if(userCoins < itemPrice) return message.reply("❌ Not enough coins!");

      // Deduct coins and add item
      economy[uid].coins = userCoins - itemPrice;
      economy[uid].items.push(item.name);

      // Save economy
      fs.writeFileSync(econFile, JSON.stringify(economy, null, 2));

      // Success message
      return message.reply(`✅ You bought ${item.name}!\n💰 Remaining coins: ${economy[uid].coins}`);
    }

    return message.reply("❌ Invalid command! Use 'view' or 'buy <item name>'.");
  }
};
