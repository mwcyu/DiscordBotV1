const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} = require("discord.js");
const { upcomingRaidDates, label } = require("../../utils/raidDates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absence")
    .setDescription("Add an Absence")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to mark absent (optional)")
        .setRequired(false)
    ),
  async execute(interaction) {
    const dates = upcomingRaidDates(4); // this + next 3 weeks

    const actionRow = new ActionRowBuilder();
    const menu = new StringSelectMenuBuilder()
      .setCustomId("absence-select")
      .setPlaceholder("Which Date?")
      .addOptions(
        dates.map((d) => ({
          label: label(d),
          value: d.toISOString(),
        }))
      );

    actionRow.addComponents(menu);

    const embed = new EmbedBuilder()
      .setTitle("Mark An Absence")
      .setDescription("Select the raid date for the absence.")
      .setColor(0xff6b6b);
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });
  },
};
