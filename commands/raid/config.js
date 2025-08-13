const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("raidconfig")
    .setDescription("Configure raid role settings for this server (Admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setrole")
        .setDescription("Set the role that can be managed by raid commands")
        .addRoleOption((option) =>
          option
            .setName("role")
            .setDescription("The role to set for raid management")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("show")
        .setDescription("Show current raid configuration for this server")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("clear")
        .setDescription("Clear the raid role configuration (allow all users)")
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "setrole") {
      const role = interaction.options.getRole("role");

      try {
        // Find existing config or create new one
        let guildConfig = await GuildConfig.findOne({
          guildId: interaction.guild.id,
        });

        if (guildConfig) {
          // Update existing config
          guildConfig.raidRoleId = role.id;
          guildConfig.raidRoleName = role.name;
          guildConfig.guildName = interaction.guild.name;
          guildConfig.configuredBy = interaction.user.id;
          await guildConfig.save();
        } else {
          // Create new config
          guildConfig = new GuildConfig({
            guildId: interaction.guild.id,
            guildName: interaction.guild.name,
            raidRoleId: role.id,
            raidRoleName: role.name,
            configuredBy: interaction.user.id,
          });
          await guildConfig.save();
        }

        const embed = new EmbedBuilder()
          .setTitle("✅ Raid Role Configuration Updated")
          .setDescription(
            `Raid commands will now only show users with the **${role.name}** role.`
          )
          .addFields(
            { name: "Role", value: `<@&${role.id}>`, inline: true },
            {
              name: "Configured by",
              value: `<@${interaction.user.id}>`,
              inline: true,
            }
          )
          .setColor(0x00ff00)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error saving guild config:", error);

        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ Configuration Error")
          .setDescription(
            "Failed to save the role configuration. Please try again."
          )
          .setColor(0xff0000);

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } else if (subcommand === "show") {
      try {
        const guildConfig = await GuildConfig.findOne({
          guildId: interaction.guild.id,
        });

        if (!guildConfig || !guildConfig.raidRoleId) {
          const embed = new EmbedBuilder()
            .setTitle("🔧 Raid Configuration")
            .setDescription(
              "No raid role is currently configured. All users will be shown in raid commands."
            )
            .addFields({
              name: "To configure",
              value: "Use `/raidconfig setrole` to set a raid role",
              inline: false,
            })
            .setColor(0x999999);

          await interaction.reply({ embeds: [embed] });
        } else {
          // Check if role still exists
          const role = interaction.guild.roles.cache.get(
            guildConfig.raidRoleId
          );

          const embed = new EmbedBuilder()
            .setTitle("🔧 Current Raid Configuration")
            .addFields(
              {
                name: "Raid Role",
                value: role
                  ? `<@&${guildConfig.raidRoleId}>`
                  : `⚠️ Role deleted (${guildConfig.raidRoleName})`,
                inline: true,
              },
              {
                name: "Configured by",
                value: `<@${guildConfig.configuredBy}>`,
                inline: true,
              },
              {
                name: "Last updated",
                value: `<t:${Math.floor(
                  guildConfig.updatedAt.getTime() / 1000
                )}:R>`,
                inline: true,
              }
            )
            .setColor(role ? 0x0099ff : 0xffaa00)
            .setTimestamp();

          if (!role) {
            embed.setDescription(
              "⚠️ The configured role no longer exists. Please update the configuration."
            );
          }

          await interaction.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error("Error fetching guild config:", error);

        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ Configuration Error")
          .setDescription(
            "Failed to fetch the role configuration. Please try again."
          )
          .setColor(0xff0000);

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } else if (subcommand === "clear") {
      try {
        const guildConfig = await GuildConfig.findOne({
          guildId: interaction.guild.id,
        });

        if (!guildConfig || !guildConfig.raidRoleId) {
          const embed = new EmbedBuilder()
            .setTitle("ℹ️ No Configuration to Clear")
            .setDescription("No raid role is currently configured.")
            .setColor(0x999999);

          await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
          // Clear the role configuration
          guildConfig.raidRoleId = null;
          guildConfig.raidRoleName = null;
          guildConfig.configuredBy = interaction.user.id;
          await guildConfig.save();

          const embed = new EmbedBuilder()
            .setTitle("✅ Raid Role Configuration Cleared")
            .setDescription(
              "Raid commands will now show all users in the server."
            )
            .addFields({
              name: "Cleared by",
              value: `<@${interaction.user.id}>`,
              inline: true,
            })
            .setColor(0x00ff00)
            .setTimestamp();

          await interaction.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error("Error clearing guild config:", error);

        const errorEmbed = new EmbedBuilder()
          .setTitle("❌ Configuration Error")
          .setDescription(
            "Failed to clear the role configuration. Please try again."
          )
          .setColor(0xff0000);

        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
