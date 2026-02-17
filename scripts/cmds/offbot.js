module.exports = {
 config: {
 name: "offbot",
 version: "1.0",
 author: "Chitron Bhattacharjee",
 countDown: 45,
 role: 0,
 shortDescription: "Turn off bot",
 longDescription: "Turn off bot",
 category: "owner",
 guide: "{p}{n}"
 },
 onStart: async function ({event, api}) {
 const permission = [ "61585911203262" ];
 if (!permission.includes(event.senderID)) {
 api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nONLY MY LORD ITACHI CAN USE THIS CMD.\n═══ஜ۩۞۩ஜ═══╝", event.threadID, event.messageID);
 return;
 }
 api.sendMessage("╔════ஜ۩۞۩ஜ═══╗\nsuccessfully Turned Off System ✅\═══ஜ۩۞۩ஜ═══╝",event.threadID, () =>process.exit(0))}
};
