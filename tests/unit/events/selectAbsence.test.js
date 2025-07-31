// Unit tests for select absence event handler
const {
  MockInteraction,
  MockUser,
  MockClient,
} = require("../../mocks/discord.js");
const {
  createMockSelectInteraction,
  createTestAbsence,
  assertInteractionUpdate,
} = require("../../testHelpers");
const Absence = require("../../../models/Absence");
const selectAbsenceEvent = require("../../events/selectAbsence");

describe("SelectAbsence Event Handler", () => {
  let mockClient;
  let mockUser;
  let mockGuild;

  beforeEach(async () => {
    await Absence.deleteMany({});

    mockClient = new MockClient();
    mockUser = new MockUser("user123", "testuser", "Test User");
    mockGuild = { id: "guild123" };
  });

  describe("Event Registration", () => {
    test("should have correct event name and structure", () => {
      expect(selectAbsenceEvent.name).toBe("interactionCreate");
      expect(selectAbsenceEvent.execute).toBeDefined();
      expect(typeof selectAbsenceEvent.execute).toBe("function");
    });
  });

  describe("Absence Selection Handling", () => {
    test("should handle absence-select interaction correctly", async () => {
      const testDate = "2025-07-24T00:00:00.000Z";
      const interaction = createMockSelectInteraction(
        `absence-select-${mockUser.id}`,
        [testDate],
        {
          user: mockUser,
          guild: mockGuild,
          client: mockClient,
        }
      );

      await selectAbsenceEvent.execute(interaction);

      // Verify database operation
      const createdAbsence = await Absence.findOne({
        userId: mockUser.id,
        guildId: mockGuild.id,
        raidDate: new Date(testDate),
      });

      expect(createdAbsence).toBeTruthy();
      expect(createdAbsence.username).toBe(mockUser.username);
      expect(createdAbsence.globalName).toBe(mockUser.globalName);

      // Verify interaction responses
      assertInteractionUpdate(interaction, {
        content: "✅ Done!",
        clearsComponents: true,
      });

      expect(interaction.channel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining(
            `${mockUser.username} are now marked absent`
          ),
        })
      );
    });

    test("should handle user not found scenario", async () => {
      const interaction = createMockSelectInteraction(
        "absence-select-invaliduser",
        ["2025-07-24T00:00:00.000Z"],
        {
          guild: mockGuild,
          client: mockClient,
        }
      );

      // Mock user fetch to return null
      interaction.client.users.fetch = jest.fn().mockResolvedValue(null);

      await selectAbsenceEvent.execute(interaction);

      assertInteractionUpdate(interaction, {
        content: "❌ User not found",
        clearsComponents: true,
      });
    });

    test("should handle upsert correctly for existing absence", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");

      // Create existing absence
      await Absence.create(
        createTestAbsence({
          userId: mockUser.id,
          guildId: mockGuild.id,
          raidDate: testDate,
          globalName: "Old Name",
        })
      );

      const interaction = createMockSelectInteraction(
        `absence-select-${mockUser.id}`,
        [testDate.toISOString()],
        {
          user: { ...mockUser, globalName: "New Name" },
          guild: mockGuild,
          client: mockClient,
        }
      );

      await selectAbsenceEvent.execute(interaction);

      // Verify upsert behavior
      const absences = await Absence.find({
        userId: mockUser.id,
        guildId: mockGuild.id,
        raidDate: testDate,
      });

      expect(absences).toHaveLength(1);
      expect(absences[0].globalName).toBe("New Name");
    });

    test("should handle database errors gracefully", async () => {
      const originalUpdateOne = Absence.updateOne;
      Absence.updateOne = jest
        .fn()
        .mockRejectedValue(new Error("Database error"));

      const interaction = createMockSelectInteraction(
        `absence-select-${mockUser.id}`,
        ["2025-07-24T00:00:00.000Z"],
        {
          user: mockUser,
          guild: mockGuild,
          client: mockClient,
        }
      );

      await selectAbsenceEvent.execute(interaction);

      expect(interaction.channel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("error occurred"),
        })
      );

      // Restore original method
      Absence.updateOne = originalUpdateOne;
    });
  });

  describe("Interaction Filtering", () => {
    test("should ignore non-string-select-menu interactions", async () => {
      const interaction = new MockInteraction("command");
      interaction.isStringSelectMenu = jest.fn(() => false);

      await selectAbsenceEvent.execute(interaction);

      // Should not process anything
      expect(interaction.update).not.toHaveBeenCalled();
      expect(interaction.channel.send).not.toHaveBeenCalled();
    });

    test("should ignore non-absence-select custom IDs", async () => {
      const interaction = createMockSelectInteraction(
        "other-select-menu",
        ["test"],
        { user: mockUser, guild: mockGuild, client: mockClient }
      );

      await selectAbsenceEvent.execute(interaction);

      // Should not process
      expect(interaction.update).not.toHaveBeenCalled();
      expect(interaction.channel.send).not.toHaveBeenCalled();
    });

    test("should extract user ID correctly from custom ID", async () => {
      const targetUserId = "user456";
      const targetUser = new MockUser(
        targetUserId,
        "targetuser",
        "Target User"
      );

      const interaction = createMockSelectInteraction(
        `absence-select-${targetUserId}`,
        ["2025-07-24T00:00:00.000Z"],
        {
          guild: mockGuild,
          client: mockClient,
        }
      );

      // Mock the user fetch
      interaction.client.users.fetch = jest.fn().mockResolvedValue(targetUser);

      await selectAbsenceEvent.execute(interaction);

      // Verify correct user was fetched
      expect(interaction.client.users.fetch).toHaveBeenCalledWith(targetUserId);

      // Verify absence was created for correct user
      const createdAbsence = await Absence.findOne({
        userId: targetUserId,
        guildId: mockGuild.id,
      });

      expect(createdAbsence).toBeTruthy();
      expect(createdAbsence.username).toBe(targetUser.username);
    });
  });

  describe("Date Handling", () => {
    test("should correctly parse ISO date strings", async () => {
      const testDateString = "2025-07-24T00:00:00.000Z";
      const expectedDate = new Date(testDateString);

      const interaction = createMockSelectInteraction(
        `absence-select-${mockUser.id}`,
        [testDateString],
        {
          user: mockUser,
          guild: mockGuild,
          client: mockClient,
        }
      );

      await selectAbsenceEvent.execute(interaction);

      const createdAbsence = await Absence.findOne({
        userId: mockUser.id,
        guildId: mockGuild.id,
      });

      expect(createdAbsence.raidDate).toEqual(expectedDate);
    });

    test("should handle different date formats", async () => {
      const testCases = [
        "2025-07-24T00:00:00.000Z",
        "2025-07-26T00:00:00Z",
        "2025-07-31T00:00:00.000Z",
      ];

      for (const dateString of testCases) {
        const interaction = createMockSelectInteraction(
          `absence-select-${mockUser.id}`,
          [dateString],
          {
            user: mockUser,
            guild: mockGuild,
            client: mockClient,
          }
        );

        await selectAbsenceEvent.execute(interaction);

        const createdAbsence = await Absence.findOne({
          userId: mockUser.id,
          guildId: mockGuild.id,
          raidDate: new Date(dateString),
        });

        expect(createdAbsence).toBeTruthy();
      }
    });
  });
});
