// Integration test for the complete absence workflow
const {
  MockInteraction,
  MockUser,
  MockClient,
} = require("../mocks/discord.js");
const Absence = require("../../models/Absence");
const absentCommand = require("../../commands/raid/absent");
const absentListCommand = require("../../commands/raid/absentlist");
const selectAbsenceEvent = require("../../events/selectAbsence");

describe("Absence Workflow Integration Tests", () => {
  let mockClient;
  let mockUser;
  let mockGuild;

  beforeEach(async () => {
    // Clean database
    await Absence.deleteMany({});

    // Setup mock objects
    mockClient = new MockClient();
    mockUser = new MockUser("user123", "testuser", "Test User");
    mockGuild = { id: "guild123" };
  });

  describe("Complete Absence Creation Flow", () => {
    test("should create absence through command and select menu interaction", async () => {
      // Step 1: User runs /absence command
      const commandInteraction = new MockInteraction("command");
      commandInteraction.options.getUser = jest.fn(() => null); // Self absence

      await absentCommand.execute(commandInteraction);

      // Verify command response
      expect(commandInteraction.reply).toHaveBeenCalled();
      const commandReply = commandInteraction.reply.mock.calls[0][0];
      expect(commandReply.components).toHaveLength(1);

      // Step 2: User selects a date from the menu
      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.values = ["2025-07-24T00:00:00.000Z"];

      await selectAbsenceEvent.execute(selectInteraction);

      // Verify select menu response
      expect(selectInteraction.update).toHaveBeenCalled();
      expect(selectInteraction.channel.send).toHaveBeenCalled();

      // Step 3: Verify absence was created in database
      const createdAbsence = await Absence.findOne({
        userId: mockUser.id,
        guildId: mockGuild.id,
      });

      expect(createdAbsence).toBeTruthy();
      expect(createdAbsence.username).toBe(mockUser.username);
      expect(createdAbsence.globalName).toBe(mockUser.globalName);
      expect(createdAbsence.raidDate).toEqual(
        new Date("2025-07-24T00:00:00.000Z")
      );
    });

    test("should show absence in absentlist command after creation", async () => {
      // Step 1: Create an absence directly in database
      const testDate = new Date("2025-07-24T00:00:00Z");
      await Absence.create({
        userId: mockUser.id,
        username: mockUser.username,
        globalName: mockUser.globalName,
        guildId: mockGuild.id,
        raidDate: testDate,
      });

      // Step 2: Run absentlist command
      const listInteraction = new MockInteraction("command");
      listInteraction.guild = mockGuild;
      listInteraction.options.getString = jest.fn(() => null);

      await absentListCommand.execute(listInteraction);

      // Step 3: Verify the absence appears in the list
      expect(listInteraction.reply).toHaveBeenCalled();
      const listReply = listInteraction.reply.mock.calls[0][0];

      expect(listReply.embeds).toHaveLength(1);
      const embed = listReply.embeds[0];
      expect(embed.data.fields).toBeDefined();
      expect(embed.data.fields.length).toBeGreaterThan(0);

      const field = embed.data.fields[0];
      expect(field.value).toContain(mockUser.globalName);
    });
  });

  describe("Multiple Users Absence Workflow", () => {
    test("should handle multiple users marking absent for same date", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");
      const user1 = new MockUser("user1", "user1", "User One");
      const user2 = new MockUser("user2", "user2", "User Two");

      // Both users mark absent for same date
      const selectInteraction1 = new MockInteraction(
        "selectMenu",
        `absence-select-${user1.id}`
      );
      selectInteraction1.user = user1;
      selectInteraction1.client = mockClient;
      selectInteraction1.values = [testDate.toISOString()];
      selectInteraction1.guild = mockGuild;

      const selectInteraction2 = new MockInteraction(
        "selectMenu",
        `absence-select-${user2.id}`
      );
      selectInteraction2.user = user2;
      selectInteraction2.client = mockClient;
      selectInteraction2.values = [testDate.toISOString()];
      selectInteraction2.guild = mockGuild;

      await selectAbsenceEvent.execute(selectInteraction1);
      await selectAbsenceEvent.execute(selectInteraction2);

      // Verify both absences exist
      const absences = await Absence.find({
        guildId: mockGuild.id,
        raidDate: testDate,
      });

      expect(absences).toHaveLength(2);
      expect(absences.map((a) => a.userId)).toContain(user1.id);
      expect(absences.map((a) => a.userId)).toContain(user2.id);

      // Verify both show up in absentlist
      const listInteraction = new MockInteraction("command");
      listInteraction.guild = mockGuild;
      listInteraction.options.getString = jest.fn(() => null);

      await absentListCommand.execute(listInteraction);

      const listReply = listInteraction.reply.mock.calls[0][0];
      const embed = listReply.embeds[0];

      expect(embed.data.fields).toBeDefined();
      expect(embed.data.fields.length).toBeGreaterThan(0);

      const field = embed.data.fields[0];
      expect(field.value).toContain("User One");
      expect(field.value).toContain("User Two");
    });
  });

  describe("Upsert Behavior", () => {
    test("should update existing absence instead of creating duplicate", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");

      // First absence creation
      const selectInteraction1 = new MockInteraction(
        "selectMenu",
        `absence-select-${mockUser.id}`
      );
      selectInteraction1.user = mockUser;
      selectInteraction1.client = mockClient;
      selectInteraction1.values = [testDate.toISOString()];
      selectInteraction1.guild = mockGuild;

      await selectAbsenceEvent.execute(selectInteraction1);

      // Verify one absence exists
      let absences = await Absence.find({
        userId: mockUser.id,
        guildId: mockGuild.id,
        raidDate: testDate,
      });
      expect(absences).toHaveLength(1);

      // Second absence creation for same user/date (should update, not create new)
      const selectInteraction2 = new MockInteraction(
        "selectMenu",
        `absence-select-${mockUser.id}`
      );
      selectInteraction2.user = { ...mockUser, globalName: "Updated Name" };
      selectInteraction2.client = mockClient;
      selectInteraction2.values = [testDate.toISOString()];
      selectInteraction2.guild = mockGuild;

      await selectAbsenceEvent.execute(selectInteraction2);

      // Verify still only one absence exists, but updated
      absences = await Absence.find({
        userId: mockUser.id,
        guildId: mockGuild.id,
        raidDate: testDate,
      });
      expect(absences).toHaveLength(1);
      expect(absences[0].globalName).toBe("Updated Name");
    });
  });

  describe("Error Handling", () => {
    test("should handle database connection errors gracefully", async () => {
      // Mock database error
      const originalUpdateOne = Absence.updateOne;
      Absence.updateOne = jest
        .fn()
        .mockRejectedValue(new Error("Database connection failed"));

      const selectInteraction = new MockInteraction(
        "selectMenu",
        `absence-select-${mockUser.id}`
      );
      selectInteraction.user = mockUser;
      selectInteraction.client = mockClient;
      selectInteraction.values = ["2025-07-24T00:00:00.000Z"];
      selectInteraction.guild = mockGuild;

      await selectAbsenceEvent.execute(selectInteraction);

      // Should not throw, but should send error message
      expect(selectInteraction.channel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("error occurred"),
        })
      );

      // Restore original method
      Absence.updateOne = originalUpdateOne;
    });

    test("should handle invalid user fetch gracefully", async () => {
      const selectInteraction = new MockInteraction(
        "selectMenu",
        "absence-select-invaliduser"
      );
      selectInteraction.client.users.fetch = jest.fn().mockResolvedValue(null);

      await selectAbsenceEvent.execute(selectInteraction);

      expect(selectInteraction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("User not found"),
        })
      );
    });
  });
});
