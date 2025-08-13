const {
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const Absence = require("../models/Absence");
const { label, upcomingRaidDates } = require("../utils/raidDates");
const { isUserRaidEligible } = require("../utils/roleFilter");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    // Handle absence selection
    if (interaction.customId.startsWith("absence-select-")) {
      const userId = interaction.customId.split("-").pop();
      const user = await interaction.client.users.fetch(userId);

      if (!user) {
        return await interaction.update({
          content: "❌ User not found.",
          components: [],
          embeds: [],
        });
      }

      // Check if the user is raid eligible
      const targetMember = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!targetMember) {
        return await interaction.update({
          content: "❌ User is not a member of this server.",
          components: [],
          embeds: [],
        });
      }

      const isEligible = await isUserRaidEligible(targetMember);
      if (!isEligible) {
        return await interaction.update({
          content: "❌ This user is not eligible for raid absence management in this server.",
          components: [],
          embeds: [],
        });
      }

      const selectedDate = interaction.values[0];
      const raidDate = new Date(selectedDate);

      try {
        await Absence.updateOne(
          {
            guildId: interaction.guildId,
            userId: user.id,
            raidDate,
          },
          {
            userId: user.id,
            username: user.username,
            globalName: user.globalName || user.username,
            guildId: interaction.guild.id,
            raidDate,
          },
          { upsert: true }
        );

        await interaction.update({
          content: `✅ Done!`,
          components: [],
          embeds: [],
        });

        await interaction.channel.send({
          content: `✅ ${user.username} is now marked absent for **${label(
            raidDate
          )}**.`,
          components: [],
          embeds: [],
        });
      } catch (error) {
        console.error("Error marking absence:", error);
        await interaction.channel.send({
          content:
            "❌ An error occurred while marking your absence. Please try again.",
          components: [],
          embeds: [],
        });
      }
    }
  },
};
