/**
 * FINAL Ultimate Bank System
 * Transaction History • Premium Bank Card
 * Loan Time • Jail • Freeze • Slot Compatible
 * Admin Help Hidden
 */

const fs = require("fs");
const path = __dirname + "/bankData.json";

if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}, null, 2));

/* ========== CONFIG ========== */
const ADMINS = ["61585966465927"]; // 🔴 YOUR UID
let INTEREST_RATE = 10;
const FINE_RATE = 5;
const FREEZE_AFTER = 2;
const JAIL_TIME = 30 * 60 * 1000;
const MAX_HISTORY = 10;

/* ========== DATA HANDLER ========== */
const getData = () => JSON.parse(fs.readFileSync(path));
const saveData = (d) => fs.writeFileSync(path, JSON.stringify(d, null, 2));

/* ========== RANK SYSTEM ========== */
const RANKS = [
  { name: "Bronze", min: 0, maxLoan: 2000, emoji: "🥉" },
  { name: "Silver", min: 5000, maxLoan: 5000, emoji: "🥈" },
  { name: "Gold", min: 20000, maxLoan: 15000, emoji: "🥇" },
  { name: "Platinum", min: 50000, maxLoan: 30000, emoji: "💎" },
  { name: "Elite", min: 100000, maxLoan: 60000, emoji: "👑" }
];
const getRank = (bal) => [...RANKS].reverse().find(r => bal >= r.min);

/* ========== TRANSACTION LOG ========== */
function addHistory(user, text) {
  if (!user.history) user.history = [];
  user.history.unshift(`🕒 ${new Date().toLocaleString()} • ${text}`);
  if (user.history.length > MAX_HISTORY)
    user.history = user.history.slice(0, MAX_HISTORY);
}

/* ========== POLICE NOTICE ========== */
function policeNotice(name, loan, fine, status, due) {
  return (
    `🚨🚔 GOVERNMENT POLICE NOTICE 🚔🚨\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `👤 Name: ${name}\n` +
    `📂 Case: BANK LOAN DEFAULT\n` +
    `💳 Due: $${loan}\n` +
    (fine ? `💸 Fine: $${fine}\n` : "") +
    `⏰ Deadline: ${due ? new Date(due).toLocaleString() : "N/A"}\n` +
    `🔒 Status: ${status}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `❗ FINAL WARNING`
  );
}

module.exports = {
  config: {
    name: "bank",
    version: "8.0",
    author: "ADMIN KABIR👑",
    countDown: 5,
    shortDescription: { en: "🏦 Premium Bank System" },
    category: "economy"
  },

  onStart: async function ({ message, event, args, usersData }) {
    const uid = event.senderID;
    const data = getData();
    const now = Date.now();

    if (!data[uid]) {
      data[uid] = {
        balance: 0,
        loan: 0,
        loanDue: 0,
        registered: false,
        warns: 0,
        frozen: false,
        jailedUntil: 0,
        lastWarn: 0,
        history: []
      };
      saveData(data);
    }

    const user = data[uid];
    const name = await usersData.getName(uid);

    /* ========== JAIL CHECK ========== */
    if (user.jailedUntil && now < user.jailedUntil) {
      if (!["balance", "repay"].includes(args[0])) {
        return message.reply(
          `🚓 **POLICE JAIL**\n⏳ Remaining: ${Math.ceil((user.jailedUntil - now) / 60000)} min\n🔒 Only balance & repay allowed`
        );
      }
    }

    /* ========== REGISTER ========== */
    if (args[0] === "register") {
      if (user.registered) return message.reply("❌ Already registered.");
      user.registered = true;
      user.balance = 1000;
      addHistory(user, "🏦 Account registered (+$1000)");
      saveData(data);
      return message.reply("🏦 Bank account created\n💰 Bonus: $1000");
    }

    if (!user.registered)
      return message.reply("⚠️ Use `bank register` first");

    /* ========== AUTO JAIL ON DUE MISS ========== */
    if (user.loan > 0 && user.loanDue && now > user.loanDue && !user.jailedUntil) {
      user.jailedUntil = now + JAIL_TIME;
      user.frozen = true;
      addHistory(user, "🚓 Arrested for loan default");
      saveData(data);
      return message.reply("🚓 **ARRESTED**\n⛓ Jail Time: 30 minutes");
    }

    /* ========== AUTO WARNING / FINE ========== */
    if (user.loan > 0 && user.balance < user.loan * 0.3) {
      if (now - user.lastWarn > 6 * 60 * 60 * 1000) {
        user.lastWarn = now;
        user.warns++;

        let fine = 0;
        if (user.warns >= 2) {
          fine = Math.floor((user.loan * FINE_RATE) / 100);
          user.loan += fine;
          addHistory(user, `💸 Police fine added $${fine}`);
        }
        if (user.warns >= FREEZE_AFTER) user.frozen = true;

        saveData(data);
        return message.reply(
          policeNotice(
            name,
            user.loan,
            fine,
            user.frozen ? "FROZEN" : "UNDER WATCH",
            user.loanDue
          )
        );
      }
    }

    /* ========== FREEZE CHECK ========== */
    if (user.frozen && !["balance", "repay"].includes(args[0])) {
      return message.reply("🔒 **ACCOUNT FROZEN**\nOnly balance & repay allowed");
    }

    /* ========== PUBLIC HELP ========== */
    if (!args[0]) {
      return message.reply(
        `🏦 **PREMIUM BANK FACILITIES**\n\n` +
        `💳 bank card – View bank card\n` +
        `💰 bank balance – Check balance\n` +
        `➕ bank deposit <amount>\n` +
        `➖ bank withdraw <amount>\n` +
        `💸 bank loan <amount> <hours>\n` +
        `💵 bank repay <amount>\n` +
        `📜 bank history – Transactions\n\n` +
        `✨ Secure • Realistic • Police Protected`
      );
    }

    /* ========== BANK CARD ========== */
    if (args[0] === "card") {
      const rank = getRank(user.balance);
      return message.reply(
        `💳✨ **PREMIUM BANK CARD** ✨💳\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `👤 **${name}**\n` +
        `🎖 Rank: **${rank.emoji} ${rank.name}**\n` +
        `💵 Balance: **$${user.balance}**\n` +
        `🏦 GOAT NATIONAL BANK\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `🔐 Status: ${user.frozen ? "FROZEN" : "ACTIVE"}`
      );
    }

    /* ========== TRANSACTION HISTORY ========== */
    if (args[0] === "history") {
      if (!user.history.length)
        return message.reply("📜 No transaction history yet.");
      return message.reply(
        `📜 **LAST TRANSACTIONS**\n\n` + user.history.join("\n")
      );
    }

    /* ========== BALANCE ========== */
    if (args[0] === "balance") {
      const rank = getRank(user.balance);
      return message.reply(
        `🏦 BANK STATUS\n\n` +
        `👤 ${name}\n` +
        `💵 Balance: $${user.balance}\n` +
        `💳 Loan: $${user.loan}\n` +
        `⏰ Due: ${user.loanDue ? new Date(user.loanDue).toLocaleString() : "N/A"}\n` +
        `🎖 Rank: ${rank.emoji} ${rank.name}\n` +
        `🔒 Status: ${user.frozen ? "FROZEN" : "ACTIVE"}`
      );
    }

    /* ========== DEPOSIT ========== */
    if (args[0] === "deposit") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0) return message.reply("❌ Invalid amount.");
      user.balance += amt;
      addHistory(user, `➕ Deposited $${amt}`);
      saveData(data);
      return message.reply(`➕ Deposited $${amt}`);
    }

    /* ========== WITHDRAW ========== */
    if (args[0] === "withdraw") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0) return message.reply("❌ Invalid amount.");
      if (user.balance < amt) return message.reply("❌ Insufficient balance.");
      user.balance -= amt;
      addHistory(user, `➖ Withdrawn $${amt}`);
      saveData(data);
      return message.reply(`➖ Withdrawn $${amt}`);
    }

    /* ========== LOAN ========== */
    if (args[0] === "loan") {
      if (user.loan > 0) return message.reply("❌ Repay existing loan first.");
      const amount = parseInt(args[1]);
      const hours = parseInt(args[2]);
      if (!amount || !hours)
        return message.reply("❌ bank loan <amount> <hours>");

      const rank = getRank(user.balance);
      if (amount > rank.maxLoan)
        return message.reply(`❌ Max loan: $${rank.maxLoan}`);

      const interest = Math.floor((amount * INTEREST_RATE) / 100);
      user.loan = amount + interest;
      user.balance += amount;
      user.loanDue = now + hours * 60 * 60 * 1000;
      addHistory(user, `💸 Loan taken $${amount} (+$${interest})`);
      saveData(data);

      return message.reply(
        `💸 LOAN APPROVED\nTotal Due: $${user.loan}\n⏰ Time: ${hours}h`
      );
    }

    /* ========== REPAY ========== */
    if (args[0] === "repay") {
      const amt = parseInt(args[1]);
      if (!amt || amt <= 0) return message.reply("❌ Invalid amount.");
      if (user.balance < amt) return message.reply("❌ Insufficient balance.");

      user.balance -= amt;
      user.loan -= amt;
      addHistory(user, `💵 Repaid $${amt}`);

      if (user.loan <= 0) {
        user.loan = 0;
        user.loanDue = 0;
        user.warns = 0;
        user.frozen = false;
        user.jailedUntil = 0;
      }
      saveData(data);

      return message.reply(`✅ Repayment done. Remaining: $${user.loan}`);
    }

    /* ========== ADMIN HELP (HIDDEN) ========== */
    if (args[0] === "help" && ADMINS.includes(uid)) {
      return message.reply(
        `👑 ADMIN COMMANDS\n\n` +
        `• bank admin warn @user\n` +
        `• bank admin unfreeze @user\n` +
        `• bank admin unjail @user`
      );
    }

    /* ========== ADMIN ACTIONS ========== */
    if (args[0] === "admin" && ADMINS.includes(uid)) {
      const target = Object.keys(event.mentions)[0];

      if (args[1] === "unfreeze" && target) {
        data[target].frozen = false;
        data[target].warns = 0;
        saveData(data);
        return message.reply("✅ Account unfrozen.");
      }

      if (args[1] === "unjail" && target) {
        data[target].jailedUntil = 0;
        saveData(data);
        return message.reply("✅ User released from jail.");
      }

      if (args[1] === "warn" && target) {
        const tName = await usersData.getName(target);
        return message.reply(
          policeNotice(
            tName,
            data[target].loan,
            0,
            data[target].frozen ? "FROZEN" : "UNDER WATCH",
            data[target].loanDue
          )
        );
      }
    }
  }
};
