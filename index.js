const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} = require("discord.js");
require("dotenv").config();

const token = process.env.DISCORD_TOKEN;

// Check if token exists
if (!token) {
  console.error(
    "Error: DISCORD_TOKEN not found in environment variables. Please check your .env file."
  );
  process.exit(1);
}

//setting up mongoose
const mongoose = require("mongoose");
const mongoUri = process.env.MONGO_URI;
// Check if mongoUri exists
if (!mongoUri) {
  console.error(
    "Error: MONGO_URI not found in environment variables. Please check your .env file."
  );
  process.exit(1);
}

async function startBot() {
  // Create Express app for Azure health checks
  const app = express();
  
  // Middleware for JSON parsing
  app.use(express.json());
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      bot: 'running',
      timestamp: new Date().toISOString()
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.send('Discord Bot is running!');
  });
  
  // Bot status endpoint
  app.get('/status', (req, res) => {
    res.json({
      botStatus: 'online',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version
    });
  });

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Express server running on port ${port}`);
  });

  // Create a new client instance
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.commands = new Collection();
  const foldersPath = path.join(__dirname, "commands");
  const commandFolders = fs.readdirSync(foldersPath);

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

  client.login(token);
}

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
