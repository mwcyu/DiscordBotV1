// Test helper utilities
const { MockInteraction, MockUser, MockClient } = require("./mocks/discord.js");
const Absence = require("../models/Absence");

/**
 * Creates test absence data
 */
function createTestAbsence(overrides = {}) {
  return {
    userId: "user123",
    username: "testuser",
    globalName: "Test User",
    guildId: "guild123",
    raidDate: new Date("2025-07-24T00:00:00Z"),
    ...overrides,
  };
}

/**
 * Creates multiple test absences
 */
async function createTestAbsences(count = 3, baseData = {}) {
  const absences = [];
  for (let i = 0; i < count; i++) {
    const absence = await Absence.create(
      createTestAbsence({
        userId: `user${i + 1}`,
        username: `user${i + 1}`,
        globalName: `User ${i + 1}`,
        raidDate: new Date(`2025-07-${24 + i}T00:00:00Z`),
        ...baseData,
      })
    );
    absences.push(absence);
  }
  return absences;
}

/**
 * Creates a mock command interaction
 */
function createMockCommandInteraction(options = {}) {
  const interaction = new MockInteraction("command");

  // Setup default options
  interaction.options.getUser = jest.fn(() => options.targetUser || null);
  interaction.options.getString = jest.fn((param) => options[param] || null);
  interaction.options.getSubcommand = jest.fn(
    () => options.subcommand || "test"
  );

  if (options.user) {
    interaction.user = options.user;
  }

  if (options.guild) {
    interaction.guild = options.guild;
    interaction.guildId = options.guild.id;
  }

  if (options.permissions) {
    interaction.member.permissions.has = jest.fn((permission) =>
      options.permissions.includes(permission)
    );
  }

  return interaction;
}

/**
 * Creates a mock select menu interaction
 */
function createMockSelectInteraction(
  customId,
  values = ["test-value"],
  options = {}
) {
  const interaction = new MockInteraction("selectMenu", customId);
  interaction.values = values;

  if (options.user) {
    interaction.user = options.user;
  }

  if (options.guild) {
    interaction.guild = options.guild;
    interaction.guildId = options.guild.id;
  }

  if (options.client) {
    interaction.client = options.client;
  }

  return interaction;
}

/**
 * Asserts that an interaction reply contains expected properties
 */
function assertInteractionReply(interaction, expectedProperties = {}) {
  expect(interaction.reply).toHaveBeenCalled();
  const replyCall = interaction.reply.mock.calls[0][0];

  if (expectedProperties.content) {
    expect(replyCall.content).toContain(expectedProperties.content);
  }

  if (expectedProperties.embedTitle) {
    expect(replyCall.embeds).toBeDefined();
    expect(replyCall.embeds).toHaveLength(1);
    expect(replyCall.embeds[0].data.title).toBe(expectedProperties.embedTitle);
  }

  if (expectedProperties.hasComponents !== undefined) {
    if (expectedProperties.hasComponents) {
      expect(replyCall.components).toBeDefined();
      expect(replyCall.components.length).toBeGreaterThan(0);
    } else {
      expect(replyCall.components || []).toHaveLength(0);
    }
  }

  if (expectedProperties.ephemeral !== undefined) {
    if (expectedProperties.ephemeral) {
      expect(replyCall.flags).toBeDefined();
    } else {
      expect(replyCall.flags).toBeUndefined();
    }
  }

  return replyCall;
}

/**
 * Asserts that an interaction update contains expected properties
 */
function assertInteractionUpdate(interaction, expectedProperties = {}) {
  expect(interaction.update).toHaveBeenCalled();
  const updateCall = interaction.update.mock.calls[0][0];

  if (expectedProperties.content) {
    expect(updateCall.content).toContain(expectedProperties.content);
  }

  if (
    expectedProperties.clearsComponents !== undefined &&
    expectedProperties.clearsComponents
  ) {
    expect(updateCall.components).toEqual([]);
  }

  return updateCall;
}

module.exports = {
  createTestAbsence,
  createTestAbsences,
  createMockCommandInteraction,
  createMockSelectInteraction,
  assertInteractionReply,
  assertInteractionUpdate,
  MockUser,
  MockClient,
};
