const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  Message,
  MessageFlags,
} = require("discord.js");
const { upcomingRaidDates, label } = require("../../utils/raidDates");
const { isUserRaidEligible, getRaidRoleDisplayText } = require("../../utils/roleFilter");

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
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
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
          { name: "Target User", value: `<@${targetUser.id}>`, inline: true },
          { name: "Configure Roles", value: "Server admins can use `/raidconfig` to change this setting", inline: false }
        )
        .setColor(0xff6b00);
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
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
      .setDescription(`Select the raid date for ${targetUser.id === interaction.user.id ? "your" : `<@${targetUser.id}>'s`} absence.`)
      .setColor(0xff6b6b);
      
    await interaction.reply({
      embeds: [embed],
      components: [actionRow],
      flags: MessageFlags.Ephemeral,
    });
  },
};
