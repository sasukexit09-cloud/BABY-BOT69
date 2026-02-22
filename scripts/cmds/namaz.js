const axios = require("axios");

// Fetch base API URL
async function baseApiUrl() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return res.data.mahmud;
  } catch (err) {
    console.error("Base API fetch failed:", err.message);
    return null;
  }
}

module.exports = {
  config: {
    name: "namaz",
    aliases: ["prayer", "salah"],
    version: "2.0",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "Islamic",
    guide: "{pn} <city>\nExample: {pn} Dhaka"
  },

  onStart: async function ({ message, args }) {
    try {
      // Get city or default
      const city = args.length > 0 ? args.join(" ") : "Dhaka";

      // Get base URL
      const base = await baseApiUrl();
      if (!base) {
        return message.reply("❌ API base URL load failed.");
      }

      // Build API URL
      const apiUrl = `${base}/api/namaz/font3/${encodeURIComponent(city)}`;

      // Fetch namaz times
      const res = await axios.get(apiUrl, {
        headers: {
          author: module.exports.config.author
        },
        timeout: 10000
      });

      const data = res.data;

      // Handle API error
      if (data?.error) {
        return message.reply(`❌ ${data.error}`);
      }

      // Handle success message
      if (data?.message) {
        return message.reply(data.message);
      }

      // Fallback
      return message.reply(`❌ No prayer times found for "${city}".`);

    } catch (err) {
      console.error("Namaz command error:", err.message);
      return message.reply("❌ Failed to fetch prayer times. Try again later.");
    }
  }
};