const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleconfig")
    .setDescription("Configure which role the bot will filter for raids")
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role to filter by (leave empty to remove filter)")
        .setRequired(false)
    ),
  async execute(interaction) {
    // Check if user has admin permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content:
          "❌ You need `Manage Server` permission to configure role settings!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const role = interaction.options.getRole("role");

    try {
      if (role) {
        // Set or update the role filter
        await GuildConfig.updateOne(
          { guildId: interaction.guild.id },
          {
            guildId: interaction.guild.id,
            guildRole: role.id,
          },
          { upsert: true }
        );

        const embed = new EmbedBuilder()
          .setTitle("✅ Role Filter Configured")
          .setDescription(
            `Bot will now only show users with the **${role.name}** role in raid commands.`
          )
          .setColor(0x00ff00);

        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      } else {
        // Remove role filter
        await GuildConfig.deleteOne({ guildId: interaction.guild.id });

        const embed = new EmbedBuilder()
          .setTitle("✅ Role Filter Removed")
          .setDescription("Bot will now show all users in raid commands.")
          .setColor(0x00ff00);

        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (error) {
      console.error("Error updating guild config:", error);
      await interaction.reply({
        content: "❌ An error occurred while updating the configuration.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
