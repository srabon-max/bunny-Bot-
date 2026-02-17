dice.js const dailyLimit = 20;

module.exports = {
  config: {
    name: "dice",
    version: "2.8",
    author: "Gemini AI",
    shortDescription: "Fruits Slot Game",
    longDescription: "A fun fruits game with results guaranteed",
    category: "Game",
    guide: {
      en: "{p}dice <amount>"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { senderID, threadID } = event;
    const userData = await usersData.get(senderID);

    if (!userData || typeof userData.money !== "number") {
      return api.sendMessage("❌ Account Error!", threadID);
    }

    const today = new Date().toDateString();
    let diceData = userData.data?.dice || { count: 0, date: today };

    if (diceData.date !== today) {
      diceData.count = 0;
      diceData.date = today;
    }

    if (diceData.count >= dailyLimit) {
      return api.sendMessage(`[ ⛔ LIMIT REACHED ]\nDaily Limit: ${dailyLimit} Times`, threadID);
    }

    const betAmount = parseInt(args[0]);
    if (isNaN(betAmount) || betAmount <= 0) {
      return api.sendMessage("⚠️ Use: dice <amount>", threadID);
    }

    if (betAmount > userData.money) {
      return api.sendMessage(`❌ Low Balance!\n💰 Balance: ${formatMoney(userData.money)}`, threadID);
    }

    // --- 🍎 ANIMATION START ---
    const msg = await api.sendMessage("🍎 | 🍐 | 🍇\n🎰 Spinning...", threadID);
    
    let fruits = ["🍎", "🍐", "🍇", "🍒", "🍓", "🍍", "🍉"];
    let count = 0;
    let interval = setInterval(() => {
      let f1 = fruits[Math.floor(Math.random() * fruits.length)];
      let f2 = fruits[Math.floor(Math.random() * fruits.length)];
      let f3 = fruits[Math.floor(Math.random() * fruits.length)];
      api.editMessage(`${f1} | ${f2} | ${f3}\n🎰 Spinning...`, msg.messageID);
      count++;
      if (count > 3) clearInterval(interval);
    }, 1000);

    setTimeout(async () => {
      const chance = Math.random();
      let winAmount, text, finalFruits;

      if (chance < 0.54) {
        // --- ❌ LOSS ---
        winAmount = -betAmount;
        finalFruits = "🍎 | 🍐 | 🥥"; 
        text = `--- 🎰 RESULTS ---\n\n${finalFruits}\n\n💔 RESULT: YOU LOST\n💸 Amount: -${formatMoney(betAmount)}\n💰 New Balance: ${formatMoney(userData.money + winAmount)}`;
      } else {
        // --- ✅ WIN ---
        const luckyFruits = ["🍓 | 🍓 | 🍓", "🍍 | 🍍 | 🍍", "🍉 | 🍉 | 🍉"];
        finalFruits = luckyFruits[Math.floor(Math.random() * luckyFruits.length)];
        
        winAmount = betAmount * 3; 
        text = `--- 🎰 RESULTS ---\n\n${finalFruits}\n\n🎉 RESULT: YOU WIN!\n💰 Bonus: +${formatMoney(winAmount)}\n💰 New Balance: ${formatMoney(userData.money + winAmount)}`;
      }

      diceData.count++;
      
      // ডাটাবেস আপডেট
      await usersData.set(senderID, {
        money: userData.money + winAmount,
        data: {
          ...userData.data,
          dice: diceData
        }
      });

      // রেজাল্ট মেসেজ পাঠানো (editMessage কাজ না করলে sendMessage কাজ করবে)
      try {
        await api.editMessage(text, msg.messageID);
      } catch (e) {
        api.sendMessage(text, threadID);
      }

    }, 5000);
  }
};

function formatMoney(num) {
  const n = Math.abs(num);
  if (n >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toString();
}
