const GuildConfig = require("../models/GuildConfig");

/**
 * Get the configured role ID for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<string|null>} - The role ID or null if not configured
 */
async function getGuildRoleFilter(guildId) {
  try {
    const config = await GuildConfig.findOne({ guildId });
    return config ? config.guildRole : null;
  } catch (error) {
    console.error("Error fetching guild config:", error);
    return null;
  }
}

/**
 * Check if a user has the required role for the guild
 * @param {GuildMember} member - The guild member to check
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} - True if user has role or no filter is set
 */
async function userHasRequiredRole(member, guildId) {
  try {
    const requiredRoleId = await getGuildRoleFilter(guildId);

    // If no role filter is configured, allow all users
    if (!requiredRoleId) {
      return true;
    }

    // Check if user has the required role
    return member.roles.cache.has(requiredRoleId);
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}

/**
 * Filter guild members based on the configured role
 * @param {Guild} guild - The Discord guild
 * @returns {Promise<Collection<string, GuildMember>>} - Filtered members
 */
async function getFilteredMembers(guild) {
  try {
    const requiredRoleId = await getGuildRoleFilter(guild.id);

    // If no role filter is configured, return all members
    if (!requiredRoleId) {
      return guild.members.cache;
    }

    // Filter members by role
    return guild.members.cache.filter((member) =>
      member.roles.cache.has(requiredRoleId)
    );
  } catch (error) {
    console.error("Error filtering members:", error);
    return guild.members.cache;
  }
}

module.exports = {
  getGuildRoleFilter,
  userHasRequiredRole,
  getFilteredMembers,
};
