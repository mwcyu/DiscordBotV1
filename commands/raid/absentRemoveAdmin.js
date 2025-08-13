const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  UserSelectMenuBuilder,
  MessageFlags,
} = require("discord.js");
const Absence = require("../../models/Absence");
const {
  upcomingRaidDates,
  label,
  userAbsenceDates,
} = require("../../utils/raidDates");
const { isUserRaidEligible, getRaidRoleDisplayText } = require("../../utils/roleFilter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("adminabsentremove")
    .setDescription("Remove an Absence (Admin Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove absence")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      const embed = new EmbedBuilder()
        .setTitle("❌ Permission Denied")
        .setDescription("You don't have permission to remove absences for other members!")
        .setColor(0xff0000);
        
      return await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    const user = interaction.options.getUser("user");
    const targetMember = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    if (!targetMember) {
      const embed = new EmbedBuilder()
        .setTitle("❌ User Not Found")
        .setDescription("The specified user is not a member of this server.")
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    
    // Check if the target user is eligible for raid commands
    const isEligible = await isUserRaidEligible(targetMember);
    if (!isEligible) {
      const roleDisplayText = await getRaidRoleDisplayText(interaction.guild);
      
      const embed = new EmbedBuilder()
        .setTitle("❌ User Not Eligible")
        .setDescription(`This server is configured to only manage absences for: **${roleDisplayText}**`)
        .addFields(
          { name: "Target User", value: `<@${user.id}>`, inline: true },
          { name: "Configure Roles", value: "Use `/raidconfig` to change this setting", inline: false }
        )
        .setColor(0xff6b00);
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const actionRow = new ActionRowBuilder();
    const userAbsencesDates = await userAbsenceDates(user, interaction);

    // If no absences found, inform the user
    if (userAbsencesDates.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ No Absences Found")
        .setDescription(`No absences found for ${user.username}.`)
        .setColor(0x999999);
        
      return await interaction.reply({
        embeds: [embed],
        ephemeral: true
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
      .setTitle("Remove Absence (Admin)")
      .setDescription(
        `Select the raid date to remove ${user.username}'s absence.`
      )
      .setColor(0xff6b6b);
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      flags: MessageFlags.Ephemeral,
    });
  },
};
