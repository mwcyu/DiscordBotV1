const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
const { upcomingRaidDates, label } = require("../../utils/raidDates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absence")
    .setDescription("Tell the bot you will miss a raid day"),

  async execute(interaction) {
    const dates = upcomingRaidDates(4); // this + next 3 weeks
    const menu = new StringSelectMenuBuilder()
      .setCustomId("absence-select")
      .setPlaceholder("Pick the raid you will miss")
      .addOptions(
        dates.map((d) => ({
          label: label(d),
          value: d.toISOString(),
        }))
      );

    await interaction.reply({
      content: "Which raid will you miss?",
      components: [new ActionRowBuilder().addComponents(menu)],
      flags: 64, // ephemeral
    });
  },
};
