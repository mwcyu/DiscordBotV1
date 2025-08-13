const mongoose = require("mongoose");

const guildconfigSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
    },
    guildRole: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate absences for the same user on the same raid date
guildconfigSchema.index({ guildId: 1 }, { unique: true });

module.exports = mongoose.model("GuildConfig", guildconfigSchema);
