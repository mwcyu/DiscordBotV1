const { Events } = require("discord.js");
const Absence = require("../models/Absence");
const { label } = require("../utils/raidDates");

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "absence-select") return;

    const raidDate = new Date(interaction.values[0]);

    await Absence.updateOne(
      { userId: interaction.user.id, raidDate },
      {
        userId: interaction.user.id,
        username: interaction.user.username,
        globalName: interaction.user.globalName,
        raidDate,
      },
      { upsert: true }
    );

    await interaction.update({
      content: `✅ Marked absent for **${label(raidDate)}**.`,
      components: [],
    });
  },
};
