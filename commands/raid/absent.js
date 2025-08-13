const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  Message,
  MessageFlags,
} = require("discord.js");
const { upcomingRaidDates, label } = require("../../utils/raidDates");
const { userHasRequiredRole } = require("../../utils/roleFilter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absent")
    .setDescription("Add an Absence")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to mark absent (optional)")
        .setRequired(false)
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id);

    // Check if the target user has the required role (if role filter is configured)
    const hasRequiredRole = await userHasRequiredRole(
      member,
      interaction.guild.id
    );

    if (!hasRequiredRole) {
      return await interaction.reply({
        content:
          "❌ This user doesn't have the required role for raid management.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const dates = upcomingRaidDates(4); // this + next 3 weeks

    const actionRow = new ActionRowBuilder();
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`absence-select-${targetUser.id}`)
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
      .setDescription(
        `Select the raid date for ${targetUser.username}'s absence.`
      )
      .setColor(0xff6b6b);
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      flags: MessageFlags.Ephemeral,
    });
  },
};
