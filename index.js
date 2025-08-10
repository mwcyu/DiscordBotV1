const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
require("dotenv").config();

// Read environment variables
const token = process.env.DISCORD_TOKEN;
const mongoUri = process.env.MONGO_URI;

if (!token) {
  console.error("Error: DISCORD_TOKEN not found in environment variables.");
  process.exit(1);
}
if (!mongoUri) {
  console.error("Error: MONGO_URI not found in environment variables.");
  process.exit(1);
}

// Set up MongoDB connection
const mongoose = require("mongoose");

// Main startup function
async function startBot() {
  // Attempt to register slash commands (optional)
  try {
    console.log("Attempting to deploy commands...");
    require("./deploy-commands.js");
    console.log("Commands deployed successfully");
  } catch (error) {
    console.warn(
      "Command deployment failed, continuing without deploying commands:",
      error.message
    );
  }

  // Create a minimal Express app to satisfy Azure health checks
  const app = express();
  app.use(express.json());

  // Health‑check endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      bot: "running",
      timestamp: new Date().toISOString(),
    });
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.send("Discord Bot is running!");
  });

  // Status endpoint
  app.get("/status", (req, res) => {
    res.json({
      botStatus: "online",
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
    });
  });

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
  });

  // Discord client setup
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      // GatewayIntentBits.MessageContent, // Temporarily disabled - enable in Discord Developer Portal first
    ],
  });

  client.commands = new Collection();
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

  // Load command modules
  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }

  // Load event handlers
  const eventsPath = path.join(__dirname, "events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }

  // Log in to Discord
  client.login(token);
}

// Connect to MongoDB and start bot
mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Successfully connected to MongoDB");
    startBot();
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  });
