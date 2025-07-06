const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  InteractionType,
} = require("discord.js");
const mongoose = require("mongoose");
const express = require("express");
const app = express();

// MongoDB Connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

// MongoDB Schema
const idSchema = new mongoose.Schema({
  userId: String,
  bgmi: String,
  ff: String
});

const UID = mongoose.model("UID", idSchema);

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
    console.log("✅ Slash Commands Registered");
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
    await UID.findOneAndUpdate(
      { userId },
      { $set: { bgmi: bgmiId } },
      { upsert: true }
    );
    await sendReplyWithTimeout(`✅ Your BGMI ID **${bgmiId}** has been saved!`);
  }

  if (interaction.commandName === "bgmi-get-id") {
    const user = interaction.options.getUser("user");
    const record = await UID.findOne({ userId: user.id });
    const message = (record?.bgmi)
      ? `📱 **${user.username}**'s BGMI ID: **${record.bgmi}**`
      : `❌ No BGMI ID saved for **${user.username}**.`;
    await sendReplyWithTimeout(message);
  }

  if (interaction.commandName === "bgmi-remove-id") {
    await UID.findOneAndUpdate(
      { userId },
      { $unset: { bgmi: "" } }
    );
    await sendReplyWithTimeout(`🗑️ Your BGMI ID has been removed.`);
  }

  if (interaction.commandName === "ff-add-id") {
    const ffId = interaction.options.getString("id");
    await UID.findOneAndUpdate(
      { userId },
      { $set: { ff: ffId } },
      { upsert: true }
    );
    await sendReplyWithTimeout(`✅ Your Free Fire ID **${ffId}** has been saved!`);
  }

  if (interaction.commandName === "ff-get-id") {
    const user = interaction.options.getUser("user");
    const record = await UID.findOne({ userId: user.id });
    const message = (record?.ff)
      ? `🎮 **${user.username}**'s Free Fire ID: **${record.ff}**`
      : `❌ No Free Fire ID saved for **${user.username}**.`;
    await sendReplyWithTimeout(message);
  }

  if (interaction.commandName === "ff-remove-id") {
    await UID.findOneAndUpdate(
      { userId },
      { $unset: { ff: "" } }
    );
    await sendReplyWithTimeout(`🗑️ Your Free Fire ID has been removed.`);
  }
});

// Web server for uptime pings
app.get('/', (req, res) => {
  res.send('Bot is online!');
});

app.listen(3000, () => {
  console.log('🌐 Web server is live for uptime pings');
});

// Bot login
client.login(process.env.BOT_TOKEN);
