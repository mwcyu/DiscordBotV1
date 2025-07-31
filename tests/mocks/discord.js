// Mock Discord.js module for testing
class MockUser {
  constructor(id = "user123", username = "testuser", globalName = "Test User") {
    this.id = id;
    this.username = username;
    this.globalName = globalName;
    this.tag = `${username}#1234`;
  }
}

class MockMember {
  constructor(user = new MockUser(), permissions = []) {
    this.user = user;
    this.id = user.id;
    this.permissions = {
      has: jest.fn((permission) => permissions.includes(permission)),
    };
  }
}

class MockGuild {
  constructor(id = "guild123") {
    this.id = id;
    this.members = {
      fetch: jest.fn(() => Promise.resolve(new MockMember())),
    };
  }
}

class MockChannel {
  constructor() {
    this.send = jest.fn(() => Promise.resolve({ id: "message123" }));
  }
}

class MockInteraction {
  constructor(type = "command", customId = "test") {
    this.user = new MockUser();
    this.member = new MockMember(this.user);
    this.guild = new MockGuild();
    this.guildId = this.guild.id;
    this.channel = new MockChannel();
    this.customId = customId;
    this.values = ["test-value"];
    this.replied = false;
    this.deferred = false;

    this.options = {
      getUser: jest.fn(() => null),
      getString: jest.fn(() => null),
      getSubcommand: jest.fn(() => "test"),
    };

    this.reply = jest.fn(() => {
      this.replied = true;
      return Promise.resolve({ id: "message123" });
    });

    this.update = jest.fn(() => Promise.resolve({ id: "message123" }));
    this.followUp = jest.fn(() => Promise.resolve({ id: "message123" }));
    this.editReply = jest.fn(() => Promise.resolve({ id: "message123" }));
    this.deferReply = jest.fn(() => {
      this.deferred = true;
      return Promise.resolve();
    });

    this.isChatInputCommand = jest.fn(() => type === "command");
    this.isStringSelectMenu = jest.fn(() => type === "selectMenu");
    this.isButton = jest.fn(() => type === "button");
    this.isUserSelectMenu = jest.fn(() => type === "userSelectMenu");
  }
}

class MockClient {
  constructor() {
    this.user = new MockUser("bot123", "testbot");
    this.users = {
      fetch: jest.fn((id) => Promise.resolve(new MockUser(id))),
    };
    this.commands = new Map();
  }
}

// Mock builders
class SlashCommandBuilder {
  constructor() {
    this.name = "";
    this.description = "";
    this.options = [];
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  addUserOption(callback) {
    const option = new MockOption("user");
    callback(option);
    this.options.push(option);
    return this;
  }

  addStringOption(callback) {
    const option = new MockOption("string");
    callback(option);
    this.options.push(option);
    return this;
  }

  setDefaultMemberPermissions(permissions) {
    this.defaultMemberPermissions = permissions;
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      description: this.description,
      options: this.options,
    };
  }
}

class MockOption {
  constructor(type) {
    this.type = type;
    this.name = "";
    this.description = "";
    this.required = false;
    this.choices = [];
  }

  setName(name) {
    this.name = name;
    return this;
  }

  setDescription(description) {
    this.description = description;
    return this;
  }

  setRequired(required) {
    this.required = required;
    return this;
  }

  addChoices(...choices) {
    this.choices.push(...choices);
    return this;
  }
}

class EmbedBuilder {
  constructor() {
    this.data = {};
  }

  setTitle(title) {
    this.data.title = title;
    return this;
  }

  setDescription(description) {
    this.data.description = description;
    return this;
  }

  setColor(color) {
    this.data.color = color;
    return this;
  }

  addFields(...fields) {
    this.data.fields = [...(this.data.fields || []), ...fields];
    return this;
  }

  toJSON() {
    return this.data;
  }
}

class ActionRowBuilder {
  constructor() {
    this.components = [];
  }

  addComponents(...components) {
    this.components.push(...components);
    return this;
  }
}

class StringSelectMenuBuilder {
  constructor() {
    this.data = {};
  }

  setCustomId(customId) {
    this.data.custom_id = customId;
    return this;
  }

  setPlaceholder(placeholder) {
    this.data.placeholder = placeholder;
    return this;
  }

  addOptions(...options) {
    this.data.options = [...(this.data.options || []), ...options];
    return this;
  }
}

// Mock Events
const Events = {
  ClientReady: "ready",
  InteractionCreate: "interactionCreate",
};

// Mock Permission Flags
const PermissionFlagsBits = {
  ManageMessages: 1n << 13n,
  BanMembers: 1n << 2n,
};

const MessageFlags = {
  Ephemeral: 1 << 6,
};

module.exports = {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  Events,
  PermissionFlagsBits,
  MessageFlags,
  MockUser,
  MockMember,
  MockGuild,
  MockChannel,
  MockInteraction,
  MockClient,
};
