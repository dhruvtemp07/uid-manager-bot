const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  InteractionType,
} = require("discord.js");
const fs = require("fs");
const express = require("express");
const app = express();

// Load saved IDs
let ids = {};
if (fs.existsSync("ids.json") && fs.readFileSync("ids.json").length > 0) {
  ids = JSON.parse(fs.readFileSync("ids.json"));
}

// Bot client setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName("bgmi-add-id")
    .setDescription("Add your BGMI ID")
    .addStringOption(option =>
      option.setName("id").setDescription("Your BGMI ID").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("bgmi-get-id")
    .setDescription("Get someone's BGMI ID")
    .addUserOption(option =>
      option.setName("user").setDescription("User to get BGMI ID").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("bgmi-remove-id")
    .setDescription("Remove your BGMI ID"),

  new SlashCommandBuilder()
    .setName("ff-add-id")
    .setDescription("Add your Free Fire ID")
    .addStringOption(option =>
      option.setName("id").setDescription("Your Free Fire ID").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ff-get-id")
    .setDescription("Get someone's Free Fire ID")
    .addUserOption(option =>
      option.setName("user").setDescription("User to get Free Fire ID").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ff-remove-id")
    .setDescription("Remove your Free Fire ID"),
];

// Register commands
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("Deleting old commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.SERVER_ID),
      { body: [] }
    );

    console.log("Registering new commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.BOT_ID, process.env.SERVER_ID),
      { body: commands }
    );
    console.log("Done!");
  } catch (err) {
    console.error(err);
  }
})();

// Interaction commands handler
client.on("interactionCreate", async interaction => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;

  const userId = interaction.user.id;

  const sendReplyWithTimeout = async (content) => {
    const replyMsg = await interaction.reply({ content, fetchReply: true });
    setTimeout(() => replyMsg.delete().catch(() => {}), 10000);
  };

  if (interaction.commandName === "bgmi-add-id") {
    const bgmiId = interaction.options.getString("id");
    if (!ids[userId]) ids[userId] = {};
    ids[userId].bgmi = bgmiId;
    fs.writeFileSync("ids.json", JSON.stringify(ids, null, 2));
    await sendReplyWithTimeout(`✅ Your BGMI ID **${bgmiId}** has been saved!`);
  }

  if (interaction.commandName === "bgmi-get-id") {
    const user = interaction.options.getUser("user");
    const message = (ids[user.id] && ids[user.id].bgmi)
      ? `📱 **${user.username}**'s BGMI ID: **${ids[user.id].bgmi}**`
      : `❌ No BGMI ID saved for **${user.username}**.`;
    await sendReplyWithTimeout(message);
  }

  if (interaction.commandName === "bgmi-remove-id") {
    if (ids[userId] && ids[userId].bgmi) {
      delete ids[userId].bgmi;
      fs.writeFileSync("ids.json", JSON.stringify(ids, null, 2));
      await sendReplyWithTimeout(`🗑️ Your BGMI ID has been removed.`);
    } else {
      await sendReplyWithTimeout(`❌ You haven't saved your BGMI ID yet.`);
    }
  }

  if (interaction.commandName === "ff-add-id") {
    const ffId = interaction.options.getString("id");
    if (!ids[userId]) ids[userId] = {};
    ids[userId].ff = ffId;
    fs.writeFileSync("ids.json", JSON.stringify(ids, null, 2));
    await sendReplyWithTimeout(`✅ Your Free Fire ID **${ffId}** has been saved!`);
  }

  if (interaction.commandName === "ff-get-id") {
    const user = interaction.options.getUser("user");
    const message = (ids[user.id] && ids[user.id].ff)
      ? `🎮 **${user.username}**'s Free Fire ID: **${ids[user.id].ff}**`
      : `❌ No Free Fire ID saved for **${user.username}**.`;
    await sendReplyWithTimeout(message);
  }

  if (interaction.commandName === "ff-remove-id") {
    if (ids[userId] && ids[userId].ff) {
      delete ids[userId].ff;
      fs.writeFileSync("ids.json", JSON.stringify(ids, null, 2));
      await sendReplyWithTimeout(`🗑️ Your Free Fire ID has been removed.`);
    } else {
      await sendReplyWithTimeout(`❌ You haven't saved your Free Fire ID yet.`);
    }
  }
});

// Web server for uptime
app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(3000, () => {
  console.log('Web server is live.');
});

// Bot login
client.login(process.env.BOT_TOKEN);
