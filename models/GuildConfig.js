const mongoose = require("mongoose");

const guildConfigSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true,
    },
    guildName: {
      type: String,
      required: true,
    },
    raidRoleId: {
      type: String,
      default: null,
      description: "Role ID for users who can be managed by raid commands",
    },
    raidRoleName: {
      type: String,
      default: null,
      description: "Role name for display purposes",
    },
    configuredBy: {
      type: String,
      required: true,
      description: "User ID of who configured this setting",
    },
    configuredAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field on save
guildConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Compound index to ensure one config per guild
guildConfigSchema.index({ guildId: 1 }, { unique: true });

module.exports = mongoose.model("GuildConfig", guildConfigSchema);
