const axios = require("axios");
const moment = require("moment-timezone");

const TIMEZONE = "Asia/Dhaka";
const CITY = "Dhaka";
const COUNTRY = "Bangladesh";

// Prayer times & sent tracker
let prayerTimes = {};
let sentToday = {};

// ===== FETCH PRAYER TIMES =====
async function fetchPrayerTimes() {
  try {
    const today = moment().tz(TIMEZONE).format("DD-MM-YYYY");

    const res = await axios.get(
      `https://api.aladhan.com/v1/timingsByCity/${today}?city=${CITY}&country=${COUNTRY}&method=2`
    );

    prayerTimes = res.data.data.timings;
    sentToday = {};

    console.log("✅ Prayer times updated:", prayerTimes);
  } catch (err) {
    console.error("❌ Failed to fetch prayer times:", err.message);
  }
}

// ===== HELPER =====
function toTimeObj(timeStr) {
  return moment.tz(timeStr, "HH:mm", TIMEZONE);
}

// ===== START BOT =====
async function startGoatRamadanBotAuto(api) {
  await fetchPrayerTimes();

  setInterval(async () => {
    const now = moment().tz(TIMEZONE);
    const currentTime = now.format("HH:mm");

    const fajrTime = toTimeObj(prayerTimes.Fajr);
    const dhuhrTime = toTimeObj(prayerTimes.Dhuhr);
    const asrTime = toTimeObj(prayerTimes.Asr);
    const maghribTime = toTimeObj(prayerTimes.Maghrib);
    const ishaTime = toTimeObj(prayerTimes.Isha);

    // 🌙 Sehri reminder 30 min before Fajr, every 5 min
    const sehriStart = fajrTime.clone().subtract(30, "minutes");
    const diffMin = now.diff(sehriStart, "minutes");
    const isSehriTime = diffMin >= 0 && diffMin <= 30 && diffMin % 5 === 0;

    // 🌇 Iftar
    const iftarTime = maghribTime.format("HH:mm");

    // 🕌 Namaz messages
    const namazMsgs = {
      Fajr: `🌙 *Fajr Namaz*\nTime: ${fajrTime.format("HH:mm")}\n🇧🇩 Bangladesh\nNamaz porun 🤲`,
      Dhuhr: `☀️ *Dhuhr Namaz*\nTime: ${dhuhrTime.format("HH:mm")}\nNamaz porun 🤲`,
      Asr: `🌤️ *Asr Namaz*\nTime: ${asrTime.format("HH:mm")}\nNamaz porun 🤲`,
      Maghrib: `🌇 *Maghrib Namaz*\nTime: ${maghribTime.format("HH:mm")}\nNamaz porun 🤲`,
      Isha: `🌃 *Isha Namaz*\nTime: ${ishaTime.format("HH:mm")}\nNamaz porun 🤲`
    };

    // Get all active threads dynamically
    const allThreads = await api.getThreadList(); // Goat bot function
    for (let thread of allThreads) {
      const threadID = thread.threadID || thread.id;

      // 🔔 Sehri
      if (isSehriTime && !sentToday[`Sehri_${threadID}_${diffMin}`]) {
        api.sendMessage(
          `🌙 *Sehri Reminder*\n⏳ Fajr er shomoy ${fajrTime.format("HH:mm")}\n🕒 Current: ${currentTime}\n🇧🇩 Bangladesh\nTarahuri kore Sehri shesh korun.`,
          threadID
        );
        sentToday[`Sehri_${threadID}_${diffMin}`] = true;
      }

      // 🔔 Iftar
      if (currentTime === iftarTime && !sentToday[`Iftar_${threadID}`]) {
        api.sendMessage(
          `🌇 *Iftar Time*\nAllahu Akbar! Roza bhangar shomoy hoyeche 🤲\n🕒 Time: ${iftarTime}\n🇧🇩 Bangladesh`,
          threadID
        );
        sentToday[`Iftar_${threadID}`] = true;
      }

      // 🔔 5 Waqt Namaz
      for (let name of ["Fajr","Dhuhr","Asr","Maghrib","Isha"]) {
        const timeStr = toTimeObj(prayerTimes[name]).format("HH:mm");
        if (currentTime === timeStr && !sentToday[`${name}_${threadID}`]) {
          api.sendMessage(namazMsgs[name], threadID);
          sentToday[`${name}_${threadID}`] = true;
        }
      }
    }

    // Reset everyday 12:01 AM
    if (currentTime === "00:01") {
      await fetchPrayerTimes();
    }

  }, 60000); // check every 1 min
}

module.exports = startGoatRamadanBotAuto;

// ===== HOW TO USE =====
// const startGoatRamadanBotAuto = require("./goatRamadanAutoThread");
// onBotStart({ api }) {
//     startGoatRamadanBotAuto(api);
// }