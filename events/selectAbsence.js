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

    // Handle absence selection
    if (interaction.customId === "absence-select") {
      const raidDate = new Date(interaction.values[0]);

      try {
        await Absence.updateOne(
          {
            guildId: interaction.guildId,
            userId: interaction.user.id,
            raidDate,
          },
          {
            userId: interaction.user.id,
            username: interaction.user.username,
            globalName:
              interaction.user.globalName || interaction.user.username,
            guildId: interaction.guild.id,
            raidDate,
          },
          { upsert: true }
        );

        await interaction.update({
          content: `✅ You are now marked absent for **${label(raidDate)}**.`,
          components: [],
          embeds: [],
        });
      } catch (error) {
        console.error("Error marking absence:", error);
        await interaction.update({
          content:
            "❌ An error occurred while marking your absence. Please try again.",
          components: [],
          embeds: [],
        });
      }
    }
  },
};
