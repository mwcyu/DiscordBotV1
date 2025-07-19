const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const Absence = require("../../models/Absence");
const { upcomingRaidDates, label } = require("../../utils/raidDates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absentreset")
    .setDescription("Reset absentlist"),

  async execute(interaction) {
    await Absence.deleteMany({
      userId: interaction.user.id,
    });

    await interaction.reply({
      content: `✅ Your absence has been reset.`,
    });
  },
};
