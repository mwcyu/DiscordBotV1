const mongoose = require("mongoose");

const absenceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    globalName: {
      type: String,
      required: true,
    },
    guildId: {
      type: String,
      required: true,
    },
    raidDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      default: "No reason provided",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate absences for the same user on the same raid date
absenceSchema.index({ userId: 1, raidDate: 1 }, { unique: true });

module.exports = mongoose.model("Absence", absenceSchema);
