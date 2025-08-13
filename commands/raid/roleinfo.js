const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { getGuildRoleFilter } = require("../../utils/roleFilter");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Show current role filter configuration"),

  async execute(interaction) {
    try {
      const roleId = await getGuildRoleFilter(interaction.guild.id);

      if (!roleId) {
        const embed = new EmbedBuilder()
          .setTitle("Role Filter Configuration")
          .setDescription(
            "❌ No role filter is currently configured.\n\nAll users can use raid commands.\n\nUse `/roleconfig` to set up a role filter."
          )
          .setColor(0xffa500);

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      const role = await interaction.guild.roles.fetch(roleId);

      if (!role) {
        const embed = new EmbedBuilder()
          .setTitle("Role Filter Configuration")
          .setDescription(
            "⚠️ Configured role not found. It may have been deleted.\n\nUse `/roleconfig` to update the configuration."
          )
          .setColor(0xff0000);

        return await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }

      const membersWithRole = role.members.size;

      const embed = new EmbedBuilder()
        .setTitle("Role Filter Configuration")
        .setDescription(`✅ Role filter is active`)
        .addFields(
          {
            name: "Filtered Role",
            value: `${role.name} (${role.toString()})`,
            inline: true,
          },
          {
            name: "Members with Role",
            value: membersWithRole.toString(),
            inline: true,
          },
          {
            name: "Effect",
            value: "Only users with this role can use raid commands",
            inline: false,
          }
        )
        .setColor(role.color || 0x00ff00);

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error fetching role info:", error);
      await interaction.reply({
        content: "❌ An error occurred while fetching role information.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
