  module.exports = {
  config: {
    name: "dhur_cringe",
    version: "1.0.0",
    author: "bunny",
    countDown: 5,
    role: 0,
    shortDescription: "Check cringe level 😬",
    longDescription: "Shows cringe level with funny verdict",
    category: "fun"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, mentions, senderID } = event;

    // ডিফল্ট target
    let targetName = "You 😭";

    try {
      if (Object.keys(mentions).length > 0) {
        // প্রথম mention-এর ID
        const firstMentionID = Object.keys(mentions)[0];

        // API দিয়ে ওই ইউজারের নাম নেওয়া
        const userInfo = await api.getUserInfo(firstMentionID);
        targetName = userInfo[firstMentionID].name;
      } else {
        // কেউ mention না করলে sender-এর নাম দেখাবে
        const senderInfo = await api.getUserInfo(senderID);
        targetName = senderInfo[senderID].name;
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
    }

    const cringeLevel = Math.floor(Math.random() * 100) + 1;

    let verdict;
    if (cringeLevel <= 20) {
      verdict = "🙂 Safe zone. Ektu normal aso.";
    } else if (cringeLevel <= 50) {
      verdict = "😬 Little cringe detected!";
    } else if (cringeLevel <= 80) {
      verdict = "🤦 Public e kom kotha bolish bhai!";
    } else {
      verdict = "💀 MAX CRINGE! Internet theke break nao!";
    }

    // 💡 এখানে Name-এর জায়গায় targetName ব্যবহার হচ্ছে
    api.sendMessage(
      `😬 DHUR CRINGE CHECK 😬

👤 Target: ${targetName}
📊 Cringe Level: ${cringeLevel}%

💬 Verdict: ${verdict}`,
      threadID,
      messageID
    );
  }
};
