 module.exports = {
  config: {
    name: "roast",
    version: "1.6.0",
    author: "bunny",
    countDown: 5,
    role: 3, // Sudo/Admin only
    shortDescription: "Extreme roast for 1 mentioned user 💀",
    category: "fun"
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID, mentions, senderID } = event;

    const roastList = [
      "Tor brain permanently in airplane mode 💀",
      "Tui holo human beta version 😂",
      "Tor logic dekhe AI o resign korlo 🤖",
      "Tui jokhon bolish, duniya buffering hoye jay 😭",
      "Confidence corrupted, restart required 💀",
      "Tui holo walking system error 🤡",
      "Tor existence e lag kore universe lag 😆",
      "Tui plan korle failure auto ready hoye jay 😭",
      "Idea zero, error 404 🤦",
      "Tui holo background noise of reality 💀",
      "Tor brain buffering 99%, crash imminent ⚠️",
      "AI bole: 'I quit' 🤖"
    ];

    const destroyList = [
      "Existence error 404.",
      "Brain not found.",
      "Confidence corrupted.",
      "System permanently damaged.",
      "IQ negative detected."
    ];

    // --- Reliable target detection ---
    let targetID, targetName;

    if (mentions && Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];

      // Try to get name from mentions object first
      targetName = mentions[targetID];

      // If name not found, fetch user info from API
      if (!targetName) {
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID].name || "Unknown User";
      }
    } else {
      return api.sendMessage(
        "⚠️ Mention koro ekjon user ke roast korte.",
        threadID,
        messageID
      );
    }

    // Randomly choose roast or destroy
    const choice = Math.floor(Math.random() * 2);

    if (choice === 0) {
      api.sendMessage(
        `🔥 EXTREME ROAST 🔥\n\n👤 Target: ${targetName}\n\n💬 ${roastList[Math.floor(Math.random() * roastList.length)]}`,
        threadID,
        messageID
      );
    } else {
      api.sendMessage(
        `☢️ NUCLEAR DESTROY ☢️\n\n🎯 Target: ${targetName}\n💀 ${destroyList[Math.floor(Math.random() * destroyList.length)]}\n🔥 Total elimination complete.`,
        threadID,
        messageID
      );
    }
  }
};
