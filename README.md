# Discord Bot V1

A Discord bot for managing raid absences and other utility functions.

## Features

- Raid absence management
- Multi-server support
- MongoDB data persistence
- Express health check endpoints

## Setup Instructions

### 1. Prerequisites

- Node.js 22.x or higher
- MongoDB database
- Discord Bot Token

### 2. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token
5. Copy the Application ID from "General Information"

### 3. Bot Permissions

When inviting the bot to servers, ensure it has these permissions:

- `Send Messages`
- `Use Slash Commands`
- `Read Message History`
- `Embed Links`

### 4. Environment Configuration

1. Copy `.env.example` to `.env`
2. Fill in your values:

```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
MONGO_URI=mongodb://localhost:27017/discordbot
PORT=8080
```

### 5. Installation

```bash
npm install
```

### 6. Deploy Commands (First Time)

```bash
npm run deploy
```

### 7. Start the Bot

```bash
npm start
```

## Development

For development with hot reload:

```bash
npm run dev
```

## Commands

- `/absent` - Mark an absence for raid dates
- `/absentlist` - View absence list
- `/absentremove` - Remove your own absence
- `/adminabsentremove` - Admin command to remove any absence
- `/raidconfig` - Configure raid role settings (Admin only)
  - `setrole` - Set which role can be managed by raid commands
  - `show` - Display current configuration
  - `clear` - Clear role configuration (allow all users)

## Role-Based Filtering

Server administrators can configure the bot to only manage raid absences for users with a specific role:

1. Use `/raidconfig setrole @RoleName` to set the raid role
2. Only users with this role will:
   - Be able to use raid commands
   - Appear in absence lists and dropdowns
   - Have their absences managed by the bot
3. Use `/raidconfig clear` to remove role restrictions
4. Use `/raidconfig show` to view current settings

This is useful for servers where only certain members participate in raids.

## Troubleshooting

### Bot doesn't respond to commands

1. Make sure commands are deployed: `npm run deploy`
2. Check bot permissions in the server
3. Verify bot token and client ID are correct
4. Check MongoDB connection

### Commands not showing up

- Global commands can take up to 1 hour to appear
- For testing, use `npm run dev` which deploys to a specific guild instantly

### Database errors

- Ensure MongoDB is running and accessible
- Check MONGO_URI in your .env file
