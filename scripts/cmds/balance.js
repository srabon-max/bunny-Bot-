const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    version: "2.5",
    author: "asif (Modified By Muzan)",
    countDown: 5,
    role: 0,
    shortDescription: "Show balance card / Transfer money",
    category: "bank",
    guide: "{pn}\n{pn} transfer <uid|@mention> <amount>\n{pn} (as reply to a user)"
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      let userID = event.senderID.toString();
      if (event.type === "message_reply" && !args[0]) userID = event.messageReply.senderID.toString();

      const userInfo = (usersData && (await usersData.get(userID))) || {};
      const userName = userInfo.name || "Unknown User";

      // === Balance Transfer ===
      if (args[0] && args[0].toLowerCase() === "transfer") {
        if (args.length < 2) return api.sendMessage(`⚠️ Usage: ${this.config.name} transfer <uid|@mention> <amount>`, event.threadID, event.messageID);
        let receiverID = null, receiverName = null;

        if (event.mentions && Object.keys(event.mentions).length > 0) {
          receiverID = Object.keys(event.mentions)[0];
          receiverName = event.mentions[receiverID] || null;
        } else if (args[1]) {
          const possibleId = String(args[1]).replace(/[^0-9]/g, "");
          if (possibleId) receiverID = possibleId;
        }

        let amountArgIndex = 2;
        if (event.mentions && Object.keys(event.mentions).length > 0) {
          let foundAmount = null;
          for (let i = 1; i < args.length; i++) if (/^\d+$/.test(args[i])) { foundAmount = args[i]; break; }
          amountArgIndex = foundAmount ? args.indexOf(foundAmount) : 1;
        }

        const amount = parseInt(args[amountArgIndex]);
        if (!receiverID) return api.sendMessage("❌ Receiver not found.", event.threadID, event.messageID);
        if (isNaN(amount) || amount <= 0) return api.sendMessage("❌ Invalid amount.", event.threadID, event.messageID);

        const senderBalance = (await usersData.get(event.senderID, "money")) || 0;
        if (senderBalance < amount) return api.sendMessage("💸 Insufficient balance.", event.threadID, event.messageID);

        const receiverInfo = (await usersData.get(receiverID)) || {};
        receiverName = receiverName || receiverInfo.name || "Unknown User";

        await usersData.set(event.senderID, { money: senderBalance - amount });
        const receiverBalance = (await usersData.get(receiverID, "money")) || 0;
        await usersData.set(receiverID, { money: receiverBalance + amount });

        return api.sendMessage(
          { body: `✅ ${userName} sent $${amount} to ${receiverName}\n📉 New Balance: $${senderBalance - amount}`, mentions: [{ id: receiverID, tag: receiverName }] },
          event.threadID,
          event.messageID
        );
      }

      // === Balance Card ===
      const balance = (await usersData.get(userID, "money")) || 0;
      function formatBalance(num) {
        const units = ["", "K", "M", "B", "T", "Q", "S", "O", "N", "D"];
        if (num < 1000) return num.toString();
        let unitIndex = 0, n = num;
        while (n >= 1000 && unitIndex < units.length - 1) { n /= 1000; unitIndex++; }
        if (units[unitIndex] === "D") return Math.floor(num).toString().slice(0, 4) + "..D";
        return n.toFixed(2).replace(/\.?0+$/, "") + units[unitIndex];
      }

      const width = 1400, height = 760;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      function roundedRectPath(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
      }

      // === Background Gradient + Stars + Nebula ===
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#0b1338");
      bgGrad.addColorStop(1, "#081033");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      function drawStars(ctx, width, height, count = 200) {
        for (let i = 0; i < count; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const r = Math.random() * 1.5;
          const a = Math.random();
          ctx.fillStyle = `rgba(255,255,255,${a})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      function drawNebula(ctx, width, height) {
        const nebulaGrad = ctx.createRadialGradient(width * 0.7, height * 0.3, 0, width * 0.7, height * 0.3, 350);
        nebulaGrad.addColorStop(0, "rgba(0, 255, 255, 0.12)");
        nebulaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, width, height);
      }

      drawStars(ctx, width, height);
      drawNebula(ctx, width, height);

      // === Border Stroke ===
      ctx.lineWidth = 8;
      const borderGrad = ctx.createLinearGradient(0, 0, width, height);
      borderGrad.addColorStop(0, "#39ff14"); // neon green
      borderGrad.addColorStop(1, "#00faff"); // neon sky blue
      ctx.strokeStyle = borderGrad;
      ctx.lineJoin = "round";
      roundedRectPath(ctx, 12, 12, width - 24, height - 24, 22);
      ctx.stroke();

      // === Header ===
      ctx.save();
      roundedRectPath(ctx, 28, 28, width - 56, 120, 18);
      ctx.clip();
      const hdrGrad = ctx.createLinearGradient(0, 28, 0, 148);
      hdrGrad.addColorStop(0, "rgba(40,35,35,0.46)");
      hdrGrad.addColorStop(1, "rgba(30,28,28,0.18)");
      ctx.fillStyle = hdrGrad;
      ctx.fillRect(28, 28, width - 56, 120);
      ctx.restore();

      ctx.fillStyle = "#ffd400";
      ctx.font = "bold 35px Sans";
      ctx.textBaseline = "middle";
      ctx.fillText('User: ' + userName + ' | Balance Info', 60, 80);

      // === Badge ===
const badgeX = width - 420, badgeY = 40, badgeW = 360, badgeH = 80;
ctx.save();

// Gradient shadow
const badgeShadowGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
badgeShadowGrad.addColorStop(0, "#00faff"); // bright cyan
badgeShadowGrad.addColorStop(1, "#5b8cff"); // soft blue
ctx.shadowColor = badgeShadowGrad;
ctx.shadowBlur = 28;

// rounded badge shape
roundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 8);

// Gradient main color
const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
badgeGrad.addColorStop(0, "#22fcff"); // left/top
badgeGrad.addColorStop(1, "#5b8cff"); // right/bottom
ctx.fillStyle = badgeGrad;
ctx.fill();
ctx.restore();

// badge text
ctx.fillStyle = "#002428";
ctx.font = "700 29px Sans";
ctx.textBaseline = "middle";
ctx.fillText("PLATINUM MEMBER", badgeX + 20, badgeY + badgeH / 2 + 2);

      // === Avatar ===
      const avatarCenterX = 160, avatarCenterY = 280, avatarRadius = 110;
      try {
        const avatarURL = `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
        const avatarImg = await loadImage(avatarURL);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
        ctx.restore();
      } catch (e) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#2a2a2a";
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Sans";
        ctx.textBaseline = "middle";
        const initials = userName.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase() || "?";
        ctx.fillText(initials, avatarCenterX - ctx.measureText(initials).width / 2, avatarCenterY);
      }

      // === Avatar Stroke ===
      const strokeGrad = ctx.createLinearGradient(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarCenterX + avatarRadius, avatarCenterY + avatarRadius);
      strokeGrad.addColorStop(0, "#00faff"); // neon sky blue
      strokeGrad.addColorStop(1, "#14ff8a"); // neon green
      ctx.lineWidth = 10;
      ctx.strokeStyle = strokeGrad;
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarRadius + 6, 0, Math.PI * 2);
      ctx.stroke();

      // === Name & ID ===
      const nameX = 330, nameY = 230;
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 48px Sans";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(userName, nameX, nameY);
      ctx.font = "30px Sans";
      ctx.fillStyle = "#bdbdbd";
      ctx.fillText(`ID: ${userID}`, nameX, nameY + 48);

      // === Masked Card ===
      ctx.font = "38px Sans";
      ctx.fillStyle = "#e8e8e8";
      const cardLast4 = userID.slice(-4);
      ctx.fillText("•••• •••• •••• " + (cardLast4 || "0000"), nameX, nameY + 104);

      const now = new Date();
      const expMonth = String(now.getMonth() + 1).padStart(2, "0");
      const expYear = String((now.getFullYear() + 3) % 100).padStart(2, "0");
      ctx.font = "26px Sans";
      ctx.fillStyle = "#cfcfcf";
      ctx.fillText("VALID THRU", nameX, nameY + 162);
      ctx.font = "30px Sans";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`: ${expMonth}/${expYear}`, nameX + 150, nameY + 162);

      // === Chip ===
      const chipX = width - 220, chipY = 230;
      ctx.fillStyle = "#14ff8a";
      roundedRectPath(ctx, chipX, chipY, 80, 60, 8);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffd400";
      ctx.beginPath();
      ctx.arc(chipX + 110, chipY + 30, 10, -1.1, 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(chipX + 110, chipY + 30, 18, -1.1, 1.1);
      ctx.stroke();

      // === Balance Box ===
      const balBoxX = 60, balBoxY = 490, balBoxW = width - 120, balBoxH = 130;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 18;
      ctx.globalAlpha = 0.85;
      roundedRectPath(ctx, balBoxX, balBoxY, balBoxW, balBoxH, 18);
      ctx.fillStyle = "rgba(18,18,25,0.45)";
      ctx.fill();
      ctx.restore();

      // === Balance Text ===
      const labelX = balBoxX + 30, labelY = balBoxY + 30;
      ctx.font = "bold 30px Sans";
      ctx.fillStyle = "#bdbdbd";
      ctx.fillText("AVAILABLE BALANCE", labelX, labelY);
      const amountX = labelX, amountY = balBoxY + 110;
      ctx.font = "bold 72px Sans";
      ctx.textBaseline = "alphabetic";
      ctx.save();
      const balGrad = ctx.createLinearGradient(amountX, amountY - 50, amountX + 600, amountY + 50);
      balGrad.addColorStop(0, "#14ff8a");
      balGrad.addColorStop(0.5, "#00faff");
      balGrad.addColorStop(1, "#ffd400");
      ctx.shadowColor = balGrad;
      ctx.shadowBlur = 36;
      ctx.fillStyle = balGrad;
      ctx.fillText(`$${formatBalance(balance)}`, amountX, amountY);
      ctx.restore();

      // === Progress-bar like bottom line of balance box ===
const barX = balBoxX;
const barY = balBoxY + balBoxH + 40; // +12 pixel niche niye ashlam
const barW = balBoxW;
const barH = 24; // lamba / muta bar

const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
barGrad.addColorStop(0, "#14ff8a");
barGrad.addColorStop(0.5, "#00faff");
barGrad.addColorStop(1, "#14ff8a");

ctx.fillStyle = barGrad;
roundedRectPath(ctx, barX, barY, barW, barH, 12); // smooth rounded corners
ctx.fill();

      // === Output ===
      const outPath = path.join(__dirname, `balance_${userID}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outPath, buffer);

      api.sendMessage(
        { body: `💳 USER BALANCE INFO\n\n👤 Name: ${userName}\n🆔 UID: ${userID}\n💰 Balance: $${formatBalance(balance)}\n📅 Valid Thru: ${expMonth}/${expYear}\n\n🏦 Personal Bank`, attachment: fs.createReadStream(outPath) },
        event.threadID,
        () => { try { fs.unlinkSync(outPath); } catch (e) {} },
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage("Error while generating balance card.", event.threadID);
    }
  }
};
