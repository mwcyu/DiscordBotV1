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
const { isUserRaidEligible, getRaidRoleDisplayText } = require("../../utils/roleFilter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absentremove")
    .setDescription("Remove an Absence"),

  async execute(interaction) {
    const targetUser = interaction.user;
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      const embed = new EmbedBuilder()
        .setTitle("❌ Error")
        .setDescription("Could not find your membership in this server.")
        .setColor(0xff0000);
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }
    
    // Check if the user is eligible for raid commands
    const isEligible = await isUserRaidEligible(targetMember);
    if (!isEligible) {
      const roleDisplayText = await getRaidRoleDisplayText(interaction.guild);
      
      const embed = new EmbedBuilder()
        .setTitle("❌ Not Eligible")
        .setDescription(`This server is configured to only manage absences for: **${roleDisplayText}**`)
        .addFields(
          { name: "Configure Roles", value: "Server admins can use `/raidconfig` to change this setting", inline: false }
        )
        .setColor(0xff6b00);
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const actionRow = new ActionRowBuilder();
    const userAbsencesDates = await userAbsenceDates(targetUser, interaction);

    // If no absences found, inform the user
    if (userAbsencesDates.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("ℹ️ No Absences Found")
        .setDescription(`No absences found for ${targetUser.username}.`)
        .setColor(0x999999);
        
      return await interaction.reply({
        embeds: [embed],
        ephemeral: true
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
