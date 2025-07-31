// Integration test for absence removal workflow
const {
  MockInteraction,
  MockUser,
  MockClient,
  PermissionFlagsBits,
} = require("../mocks/discord.js");
const Absence = require("../../models/Absence");
const absentRemoveCommand = require("../../commands/raid/absentremove");
const removeAbsentEvent = require("../../events/removeAbsentEvent");

describe("Absence Removal Workflow Integration Tests", () => {
  let mockClient;
  let mockUser;
  let mockGuild;

  beforeEach(async () => {
    await Absence.deleteMany({});

    mockClient = new MockClient();
    mockUser = new MockUser("user123", "testuser", "Test User");
    mockGuild = { id: "guild123" };
  });

  describe("Self Absence Removal Flow", () => {
    test("should remove own absence through command and select menu", async () => {
      // Setup: Create an absence first
      const testDate = new Date("2025-07-24T00:00:00Z");
      await Absence.create({
        userId: mockUser.id,
        username: mockUser.username,
        globalName: mockUser.globalName,
        guildId: mockGuild.id,
        raidDate: testDate,
      });

      // Step 1: User runs /absentremove command
      const commandInteraction = new MockInteraction("command");
      commandInteraction.user = mockUser;
      commandInteraction.guild = mockGuild;

      await absentRemoveCommand.execute(commandInteraction);

      // Verify command response shows existing absences
      expect(commandInteraction.reply).toHaveBeenCalled();
      const commandReply = commandInteraction.reply.mock.calls[0][0];
      expect(commandReply.components).toHaveLength(1);
      expect(commandReply.embeds).toHaveLength(1);

      // Step 2: User selects a date to remove
      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-remove-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.guild = mockGuild;
      selectInteraction.values = [testDate.toISOString()];

      await removeAbsentEvent.execute(selectInteraction);

      // Verify removal response
      expect(selectInteraction.update).toHaveBeenCalled();
      expect(selectInteraction.channel.send).toHaveBeenCalled();

      const updateCall = selectInteraction.update.mock.calls[0][0];
      expect(updateCall.content).toContain("Successfully removed");

      // Step 3: Verify absence was removed from database
      const remainingAbsences = await Absence.find({
        userId: mockUser.id,
        guildId: mockGuild.id,
        raidDate: testDate,
      });

      expect(remainingAbsences).toHaveLength(0);
    });

    test("should handle removing all absences", async () => {
      // Setup: Create multiple absences
      const testDate1 = new Date("2025-07-24T00:00:00Z");
      const testDate2 = new Date("2025-07-26T00:00:00Z");

      await Absence.create([
        {
          userId: mockUser.id,
          username: mockUser.username,
          globalName: mockUser.globalName,
          guildId: mockGuild.id,
          raidDate: testDate1,
        },
        {
          userId: mockUser.id,
          username: mockUser.username,
          globalName: mockUser.globalName,
          guildId: mockGuild.id,
          raidDate: testDate2,
        },
      ]);

      // Select "All Dates" option
      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-remove-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.guild = mockGuild;
      selectInteraction.values = ["all"];

      await removeAbsentEvent.execute(selectInteraction);

      // Verify all absences removed
      const remainingAbsences = await Absence.find({
        userId: mockUser.id,
        guildId: mockGuild.id,
      });

      expect(remainingAbsences).toHaveLength(0);

      const updateCall = selectInteraction.update.mock.calls[0][0];
      expect(updateCall.content).toContain("all upcoming dates");
      expect(updateCall.content).toContain("2 record(s) removed");
    });

    test("should handle no absences found scenario", async () => {
      // Run command when user has no absences
      const commandInteraction = new MockInteraction("command");
      commandInteraction.user = mockUser;
      commandInteraction.guild = mockGuild;

      await absentRemoveCommand.execute(commandInteraction);

      expect(commandInteraction.reply).toHaveBeenCalled();
      const commandReply = commandInteraction.reply.mock.calls[0][0];
      expect(commandReply.content).toContain("No absences found");
    });
  });

  describe("Absence Removal Edge Cases", () => {
    test("should handle attempting to remove non-existent absence", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");

      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-remove-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.guild = mockGuild;
      selectInteraction.values = [testDate.toISOString()];

      await removeAbsentEvent.execute(selectInteraction);

      const updateCall = selectInteraction.update.mock.calls[0][0];
      expect(updateCall.content).toContain("No absences found");
    });

    test("should only remove absences for current guild", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");

      // Create absences in multiple guilds
      await Absence.create([
        {
          userId: mockUser.id,
          username: mockUser.username,
          globalName: mockUser.globalName,
          guildId: mockGuild.id,
          raidDate: testDate,
        },
        {
          userId: mockUser.id,
          username: mockUser.username,
          globalName: mockUser.globalName,
          guildId: "other-guild",
          raidDate: testDate,
        },
      ]);

      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-remove-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.guild = mockGuild;
      selectInteraction.values = [testDate.toISOString()];

      await removeAbsentEvent.execute(selectInteraction);

      // Verify only current guild absence was removed
      const currentGuildAbsences = await Absence.find({
        userId: mockUser.id,
        guildId: mockGuild.id,
      });

      const otherGuildAbsences = await Absence.find({
        userId: mockUser.id,
        guildId: "other-guild",
      });

      expect(currentGuildAbsences).toHaveLength(0);
      expect(otherGuildAbsences).toHaveLength(1);
    });
  });

  describe("Error Handling", () => {
    test("should handle database errors gracefully", async () => {
      const originalFind = Absence.find;
      const originalDeleteMany = Absence.deleteMany;

      // Mock database error
      Absence.find = jest.fn().mockRejectedValue(new Error("Database error"));
      Absence.deleteMany = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const commandInteraction = new MockInteraction("command");
      commandInteraction.user = mockUser;
      commandInteraction.guild = mockGuild;

      await expect(
        absentRemoveCommand.execute(commandInteraction)
      ).rejects.toThrow("Database error");

      // Restore original methods
      Absence.find = originalFind;
      Absence.deleteMany = originalDeleteMany;
    });

    test("should handle select menu interaction errors", async () => {
      const originalDeleteMany = Absence.deleteMany;
      Absence.deleteMany = jest
        .fn()
        .mockRejectedValue(new Error("Delete error"));

      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-remove-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.guild = mockGuild;
      selectInteraction.values = ["2025-07-24T00:00:00.000Z"];

      await removeAbsentEvent.execute(selectInteraction);

      const updateCall = selectInteraction.update.mock.calls[0][0];
      expect(updateCall.content).toContain("error occurred");

      // Restore original method
      Absence.deleteMany = originalDeleteMany;
    });
  });
});
