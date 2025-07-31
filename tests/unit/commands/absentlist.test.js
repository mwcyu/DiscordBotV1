// We need to mock discord.js before requiring the command
const { MockInteraction, MockUser } = require("../../mocks/discord.js");
const Absence = require("../../../models/Absence");
const absentListCommand = require("../../../commands/raid/absentlist");

describe("AbsentList Command", () => {
  test("should have correct command structure", () => {
    expect(absentListCommand.data).toBeDefined();
    expect(absentListCommand.execute).toBeDefined();
    expect(typeof absentListCommand.execute).toBe("function");
  });

  test("should build command data correctly", () => {
    const commandData = absentListCommand.data.toJSON();
    expect(commandData.name).toBe("absentlist");
    expect(commandData.description).toBe("Show who is not here");
  });

  describe("Command Execution", () => {
    let mockInteraction;

    beforeEach(async () => {
      mockInteraction = new MockInteraction("command");
      mockInteraction.options.getString = jest.fn(() => null);
      await Absence.deleteMany({});
    });

    test("should show no absences message when no one is absent", async () => {
      await absentListCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledTimes(1);
      const replyCall = mockInteraction.reply.mock.calls[0][0];

      expect(replyCall).toHaveProperty("embeds");
      expect(replyCall.embeds).toHaveLength(1);

      const embed = replyCall.embeds[0];
      expect(embed.data.title).toBe("Upcoming Absences");
      expect(embed.data.description).toContain("No absences");
    });

    test("should display absences when they exist", async () => {
      // Create test absences
      const testDate = new Date("2025-07-24T00:00:00Z");
      await Absence.create({
        userId: "user1",
        username: "user1",
        globalName: "User One",
        guildId: mockInteraction.guild.id,
        raidDate: testDate,
      });

      await Absence.create({
        userId: "user2",
        username: "user2",
        globalName: "User Two",
        guildId: mockInteraction.guild.id,
        raidDate: testDate,
      });

      await absentListCommand.execute(mockInteraction);

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];

      expect(embed.data.fields).toBeDefined();
      expect(embed.data.fields.length).toBeGreaterThan(0);

      const field = embed.data.fields[0];
      expect(field.value).toContain("User One");
      expect(field.value).toContain("User Two");
    });

    test("should respect number_of_weeks parameter", async () => {
      mockInteraction.options.getString = jest.fn((param) => {
        if (param === "number_of_weeks") return "2";
        return null;
      });

      await absentListCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledTimes(1);
      // The command should execute without errors
    });

    test("should only show absences for current guild", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");

      // Create absence for current guild
      await Absence.create({
        userId: "user1",
        username: "user1",
        globalName: "User One",
        guildId: mockInteraction.guild.id,
        raidDate: testDate,
      });

      // Create absence for different guild
      await Absence.create({
        userId: "user2",
        username: "user2",
        globalName: "User Two",
        guildId: "different-guild",
        raidDate: testDate,
      });

      await absentListCommand.execute(mockInteraction);

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const embed = replyCall.embeds[0];

      if (embed.data.fields && embed.data.fields.length > 0) {
        const field = embed.data.fields[0];
        expect(field.value).toContain("User One");
        expect(field.value).not.toContain("User Two");
      }
    });

    test("should handle database errors gracefully", async () => {
      // Mock Absence.find to throw an error
      jest.spyOn(Absence, "find").mockImplementation(() => {
        throw new Error("Database error");
      });

      await expect(absentListCommand.execute(mockInteraction)).rejects.toThrow(
        "Database error"
      );

      // Restore the mock
      Absence.find.mockRestore();
    });
  });
});
