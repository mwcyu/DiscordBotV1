const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const Absence = require("../../models/Absence");
const {
  upcomingRaidDates,
  label,
  userAbsenceDates,
} = require("../../utils/raidDates");
const { userHasRequiredRole } = require("../../utils/roleFilter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absentremove")
    .setDescription("Remove an Absence"),

  async execute(interaction) {
    const targetUser = interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id);

    // Check if the user has the required role (if role filter is configured)
    const hasRequiredRole = await userHasRequiredRole(
      member,
      interaction.guild.id
    );

    if (!hasRequiredRole) {
      return await interaction.reply({
        content: "❌ You don't have the required role for raid management.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const actionRow = new ActionRowBuilder();
    const userAbsencesDates = await userAbsenceDates(targetUser, interaction);

    // If no absences found, inform the user
    if (userAbsencesDates.length === 0) {
      return await interaction.reply({
        content: `ℹ️ No absences found for ${targetUser.username}.`,
        components: [],
        embeds: [],
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`absence-remove-select-${targetUser.id}`)
      .setPlaceholder("Which Date?")
      .addOptions(
        ...userAbsencesDates.map((date) => ({
          label: label(new Date(date)),
          value: date,
        })),
        {
          label: "All Dates",
          value: "all",
        }
      );

    actionRow.addComponents(menu);

    const embed = new EmbedBuilder()
      .setTitle("Remove Absence")
      .setDescription(
        `Select the raid date to remove ${targetUser.username}'s absence.`
      )
      .setColor(0xff6b6b);
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      flags: MessageFlags.Ephemeral,
    });
  },
};
