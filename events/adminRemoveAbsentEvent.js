const {
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const Absence = require("../models/Absence");
const { label, upcomingRaidDates } = require("../utils/raidDates");
const { isUserRaidEligible } = require("../utils/roleFilter");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId.startsWith("admin-absence-remove-select-")) {
      const userId = interaction.customId.split("-").pop();
      const user = await interaction.client.users.fetch(userId);
      if (!user) {
        return await interaction.update({
          content: "❌ User not found.",
          components: [],
          embeds: [],
        });
      }

      // Check if the target user is raid eligible
      const targetMember = await interaction.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!targetMember) {
        return await interaction.update({
          content: "❌ Target user is not a member of this server.",
          components: [],
          embeds: [],
        });
      }

      const isEligible = await isUserRaidEligible(targetMember);
      if (!isEligible) {
        return await interaction.update({
          content:
            "❌ Target user is not eligible for raid absence management in this server.",
          components: [],
          embeds: [],
        });
      }

      const selectedDate = interaction.values[0];

      try {
        let deleteQuery = {
          userId: userId,
          guildId: interaction.guild.id,
        };

        if (selectedDate === "all") {
          deleteQuery.raidDate = {
            $gte: new Date(),
          };
        } else {
          deleteQuery.raidDate = new Date(selectedDate);
        }

        // First, check if any absences exist
        const existingAbsences = await Absence.find(deleteQuery);

        if (existingAbsences.length === 0) {
          const user = await interaction.client.users.fetch(userId);
          const dateText =
            selectedDate === "all"
              ? "any upcoming dates"
              : label(new Date(selectedDate));

          return await interaction.update({
            content: `ℹ️ No absences found for ${user.username} on **${dateText}**.`,
            components: [],
            embeds: [],
          });
        }

        const result = await Absence.deleteMany(deleteQuery);

        const user = await interaction.client.users.fetch(userId);
        const dateText =
          selectedDate === "all"
            ? "all upcoming dates"
            : label(new Date(selectedDate));

        await interaction.update({
          content: `✅ Successfully removed ${user.username}'s absence for **${dateText}**. (${result.deletedCount} record(s) removed)`,
          components: [],
          embeds: [],
        });

        await interaction.channel.send({
          content: `✅ Admin removed ${user.username}'s absence for **${dateText}**.`,
        });
      } catch (error) {
        console.error("Error removing absence:", error);
        await interaction.update({
          content:
            "❌ An error occurred while removing the absence. Please try again.",
          components: [],
          embeds: [],
        });
      }
    }
  },
};
