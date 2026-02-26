module.exports.config = {
  name: "leave",
  eventType: ["log:unsubscribe"],
  version: "1.0.1",
  credits: "modified",
  description: "Show full name when someone left or kicked"
};

module.exports.run = async function ({ api, event }) {

  const time = new Date().toLocaleString("en-BD", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  const leftId = event.logMessageData.leftParticipantFbId;

  const userInfo = await api.getUserInfo(leftId);
  const fullName = userInfo[leftId].name;

  // যদি নিজে থেকে left নেয়
  if (leftId == event.author) {

    return api.sendMessage(
      `𝙱𝙰𝙱𝚈 𝙸 𝙰𝙼 𝚂𝙾 𝚂𝙰𝙳 𝚄𝚁𝙴 𝙻𝙴𝙵𝚃 𝚃𝙷𝙴 𝙶𝚁𝙾𝚄𝙿 𝙱𝚄𝚃 𝙳𝙾𝙽'𝚃 𝚂𝙰𝚈 𝙼𝙴 🥺🍓🍰 ${fullName}🥺 𝙰𝚃 ${time}`,
      event.threadID
    );
  }

  // যদি admin kick দেয়
  else {

    return api.sendMessage(
      `🍓𝙰𝙳𝙼𝙸𝙽 𝙱𝙱𝙴 𝙺𝙸𝙲𝙺𝙴𝙳 𝚃𝙷𝙸𝚂 𝚄𝚂𝙴𝚁 🥺 ${fullName} 𝘼𝙏 ${time}`,
      event.threadID
    );
  }
};