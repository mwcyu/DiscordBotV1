const {
  Events,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const Absence = require("../models/Absence");
const { label, upcomingRaidDates } = require("../utils/raidDates");

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
      const selectedDate = interaction.values[0];
      console.log(selectedDate);

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
