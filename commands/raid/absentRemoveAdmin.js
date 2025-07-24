const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  UserSelectMenuBuilder,
} = require("discord.js");
const Absence = require("../../models/Absence");
const {
  upcomingRaidDates,
  label,
  userAbsenceDates,
} = require("../../utils/raidDates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("adminabsentremove")
    .setDescription("Remove an Absence")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove absence (optional)")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return await interaction.reply({
        content:
          "❌ You don't have permission to remove absences for other members!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = interaction.options.getUser("user");

    const actionRow = new ActionRowBuilder();
    const userAbsencesDates = await userAbsenceDates(user, interaction);

    // If no absences found, inform the user
    if (userAbsencesDates.length === 0) {
      return await interaction.reply({
        content: `ℹ️ No absences found for ${user.username}.`,
        components: [],
        embeds: [],
      });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`admin-absence-remove-select-${user.id}`)
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
        `Select the raid date to remove ${user.username}'s absence.`
      )
      .setColor(0xff6b6b);
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });
  },
};
