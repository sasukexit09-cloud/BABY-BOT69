module.exports = {
  onChat: async function ({ api, event }) {
    const threadID = event.threadID;

    // typing start
    api.sendTypingIndicator(threadID, true);

    // delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // typing off
    api.sendTypingIndicator(threadID, false);
  }
};
