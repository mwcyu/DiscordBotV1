// We need to mock discord.js before requiring the command
const { MockInteraction, MockUser } = require("../../mocks/discord.js");
const absentCommand = require("../../../commands/raid/absent");

describe("Absent Command", () => {
  test("should have correct command structure", () => {
    expect(absentCommand.data).toBeDefined();
    expect(absentCommand.execute).toBeDefined();
    expect(typeof absentCommand.execute).toBe("function");
  });

  test("should build command data correctly", () => {
    const commandData = absentCommand.data.toJSON();
    expect(commandData.name).toBe("absence");
    expect(commandData.description).toBe("Add an Absence");
  });

  describe("Command Execution", () => {
    let mockInteraction;

    beforeEach(() => {
      mockInteraction = new MockInteraction("command");
      mockInteraction.options.getUser = jest.fn(() => null);
    });

    test("should reply with embed and components for self absence", async () => {
      await absentCommand.execute(mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledTimes(1);
      const replyCall = mockInteraction.reply.mock.calls[0][0];

      expect(replyCall).toHaveProperty("embeds");
      expect(replyCall).toHaveProperty("components");
      expect(replyCall).toHaveProperty("flags");
      expect(replyCall.embeds).toHaveLength(1);
      expect(replyCall.components).toHaveLength(1);
    });

    test("should use correct custom ID for self absence", async () => {
      await absentCommand.execute(mockInteraction);

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const component = replyCall.components[0];

      // The custom ID should include the user's ID
      expect(component.components[0].data.custom_id).toBe(
        `absence-select-${mockInteraction.user.id}`
      );
    });

    test("should use target user ID when user option is provided", async () => {
      const targetUser = new MockUser("target123", "targetuser");
      mockInteraction.options.getUser = jest.fn(() => targetUser);

      await absentCommand.execute(mockInteraction);

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const component = replyCall.components[0];

      expect(component.components[0].data.custom_id).toBe(
        `absence-select-${targetUser.id}`
      );
    });

    test("should include raid date options", async () => {
      await absentCommand.execute(mockInteraction);

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      const selectMenu = replyCall.components[0].components[0];

      expect(selectMenu.data.options).toBeDefined();
      expect(selectMenu.data.options.length).toBeGreaterThan(0);
    });

    test("should set ephemeral flag", async () => {
      await absentCommand.execute(mockInteraction);

      const replyCall = mockInteraction.reply.mock.calls[0][0];
      expect(replyCall.flags).toBeDefined();
    });

    test("should handle errors gracefully", async () => {
      // Mock an error in the reply method
      mockInteraction.reply = jest.fn(() =>
        Promise.reject(new Error("Test error"))
      );

      await expect(absentCommand.execute(mockInteraction)).rejects.toThrow(
        "Test error"
      );
    });
  });
});
