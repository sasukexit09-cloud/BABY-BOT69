const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const models = [
  "0. Absolute Reality V16",
  "1. Absolute Reality V181",
  "2. Analog Diffusion 1.0",
  "3. Anything V3.0 (Pruned)",
  "4. Anything V4.5 (Pruned)",
  "5. Anything V5 (PrtRE)",
  "6. AOM3A3 Orange Mix",
  "7. Children's Stories V13D",
  "8. Children's Stories V1 Semi-Real",
  "9. Children's Stories V1 Toon Anime",
  "10. Cyberrealistic V33",
  "11. Deliberate V2",
  "12. Dreamlike Anime 1.0",
  "13. Dreamlike Diffusion 1.0",
  "14. Dreamlike Photoreal 2.0",
  "15. Dreamshaper 6 (Baked VAE)",
  "16. Dreamshaper 7",
  "17. Dreamshaper 8",
  "18. Edge of Realism Eor V20",
  "19. Eimis Anime Diffusion V1",
  "20. Elldreth's Vivid Mix",
  "21. Epic Realism Natural Sin RC1VAE",
  "22. I Can't Believe It's Not Photography Seco",
  "23. Juggernaut Aftermath",
  "24. Lyriel V16",
  "25. Mechamix V10",
  "26. Meinamix Meina V9",
  "27. Meinamix Meina V11",
  "28. Open Journey V4",
  "29. Portrait Plus V1.0",
  "30. Realistic Vision V1.4",
  "31. Realistic Vision V2.0",
  "32. Realistic Vision V4.0",
  "33. Realistic Vision V5.0",
  "34. Redshift Diffusion V10",
  "35. Rev Animated V122",
  "36. Run DiffusionFX 25D V10",
  "37. Run DiffusionFX V10",
  "38. SD V1.4",
  "39. V1.5",
  "40. Shonin's Beautiful V10",
  "41. The Ally's Mix II",
  "42. Timeless 1.0",
  "43. ToonYou Beta 6"
];

module.exports.config = {
  name: "imgine",
  version: "3.2",
  hasPermission: 0,
  credits: "Aliester Crowley",
  description: "Generate AI images with Stable Diffusion (Negative Prompt supported)",
  usePrefix: true,
  commandCategory: "image",
  usages: "imagine prompt | negative: words :model",
  cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID } = event;

  if (!args.length) {
    return api.sendMessage(
      `✨ Usage:
imagine a beautiful girl
imagine a beautiful girl | negative: blurry, bad hands
imagine a beautiful girl | negative: low quality :43

📦 Models:
${models.join("\n")}`,
      threadID,
      messageID
    );
  }

  let text = args.join(" ");
  let prompt = "";
  let negative = "";
  let model = 0;

  // 🔢 Model parse (last :)
  const lastColon = text.lastIndexOf(":");
  if (lastColon !== -1) {
    const possibleModel = parseInt(text.slice(lastColon + 1).trim());
    if (!isNaN(possibleModel) && possibleModel >= 0 && possibleModel < models.length) {
      model = possibleModel;
      text = text.slice(0, lastColon).trim();
    }
  }

  // 🚫 Negative prompt parse
  if (text.includes("| negative:")) {
    const parts = text.split("| negative:");
    prompt = parts[0].trim();
    negative = parts[1].trim();
  } else {
    prompt = text.trim();
  }

  if (!prompt) {
    return api.sendMessage("❗ Prompt cannot be empty.", threadID, messageID);
  }

  const waitMsg = await api.sendMessage(
    "🎨 Generating image...\n⏳ Please wait",
    threadID
  );

  try {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const imgPath = path.join(cacheDir, `imagine_${Date.now()}.png`);

    const API =
      `https://aliestercrowley.com/api/crowgen.php` +
      `?model=${model}` +
      `&prompt=${encodeURIComponent(prompt)}` +
      `&negative=${encodeURIComponent(negative)}`;

    const res = await axios.get(API, {
      responseType: "arraybuffer",
      timeout: 20000
    });

    fs.writeFileSync(imgPath, Buffer.from(res.data));

    api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      threadID,
      () => {
        fs.unlinkSync(imgPath);
        api.unsendMessage(waitMsg.messageID);
      },
      messageID
    );

  } catch (err) {
    console.error(err);
    api.unsendMessage(waitMsg.messageID);
    api.sendMessage(
      "❌ Failed to generate image. Try again later.",
      threadID,
      messageID
    );
  }
};