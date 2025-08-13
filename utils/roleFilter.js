const GuildConfig = require("../models/GuildConfig");

/**
 * Get the configured raid role for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<string|null>} - The role ID or null if not configured
 */
async function getGuildRaidRole(guildId) {
  try {
    const guildConfig = await GuildConfig.findOne({ guildId });
    return guildConfig?.raidRoleId || null;
  } catch (error) {
    console.error("Error fetching guild raid role:", error);
    return null;
  }
}

/**
 * Filter guild members based on the configured raid role
 * @param {Guild} guild - The Discord guild
 * @param {Collection} members - Collection of guild members
 * @returns {Promise<Collection>} - Filtered collection of members
 */
async function filterMembersByRaidRole(guild, members) {
  try {
    const raidRoleId = await getGuildRaidRole(guild.id);
    
    // If no role is configured, return all members
    if (!raidRoleId) {
      return members;
    }
    
    // Check if the role still exists
    const raidRole = guild.roles.cache.get(raidRoleId);
    if (!raidRole) {
      console.warn(`Configured raid role ${raidRoleId} not found in guild ${guild.id}`);
      return members;
    }
    
    // Filter members who have the raid role
    return members.filter(member => member.roles.cache.has(raidRoleId));
  } catch (error) {
    console.error("Error filtering members by raid role:", error);
    return members; // Return all members on error
  }
}

/**
 * Get guild members with the raid role, or all members if no role is configured
 * @param {Guild} guild - The Discord guild
 * @param {boolean} fetchAll - Whether to fetch all members if not cached
 * @returns {Promise<Collection>} - Collection of filtered members
 */
async function getRaidEligibleMembers(guild, fetchAll = true) {
  try {
    // Fetch all members if requested and not cached
    if (fetchAll && guild.memberCount !== guild.members.cache.size) {
      await guild.members.fetch();
    }
    
    return await filterMembersByRaidRole(guild, guild.members.cache);
  } catch (error) {
    console.error("Error getting raid eligible members:", error);
    return guild.members.cache; // Return cached members on error
  }
}

/**
 * Check if a user has the raid role (or if no role is configured)
 * @param {GuildMember} member - The guild member to check
 * @returns {Promise<boolean>} - Whether the user is raid eligible
 */
async function isUserRaidEligible(member) {
  try {
    const raidRoleId = await getGuildRaidRole(member.guild.id);
    
    // If no role is configured, all users are eligible
    if (!raidRoleId) {
      return true;
    }
    
    // Check if user has the raid role
    return member.roles.cache.has(raidRoleId);
  } catch (error) {
    console.error("Error checking if user is raid eligible:", error);
    return true; // Allow access on error
  }
}

/**
 * Get display text for the current raid role configuration
 * @param {Guild} guild - The Discord guild
 * @returns {Promise<string>} - Display text for the configuration
 */
async function getRaidRoleDisplayText(guild) {
  try {
    const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
    
    if (!guildConfig || !guildConfig.raidRoleId) {
      return "All server members";
    }
    
    const role = guild.roles.cache.get(guildConfig.raidRoleId);
    if (!role) {
      return `⚠️ Configured role not found (${guildConfig.raidRoleName})`;
    }
    
    return `Members with role: ${role.name}`;
  } catch (error) {
    console.error("Error getting raid role display text:", error);
    return "All server members";
  }
}

module.exports = {
  getGuildRaidRole,
  filterMembersByRaidRole,
  getRaidEligibleMembers,
  isUserRaidEligible,
  getRaidRoleDisplayText,
};
