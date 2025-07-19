const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Absence = require("../../models/Absence");
const { upcomingRaidDates, label } = require("../../utils/raidDates");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("absentlist")
    .setDescription("Show who is not here")
    .addStringOption((option) =>
      option
        .setName("number_of_weeks")
        .setDescription("Number of weeks to check absences for")
        .setRequired(true)
        .addChoices(
          ...Array.from({ length: 8 }, (_, i) => ({
            name: `${i + 1}`,
            value: (i + 1).toString(),
          }))
        )
    ),

  async execute(interaction) {
    const dates = upcomingRaidDates(
      interaction.options.getString("number_of_weeks")
    );

    const absences = await Promise.all(
      dates.map((d) => Absence.find({ raidDate: d }).lean().exec())
    );

    // Filter to only include dates with absences
    const datesWithAbsences = [];
    dates.forEach((date, index) => {
      if (absences[index].length > 0) {
        datesWithAbsences.push({
          date: date,
          absences: absences[index],
        });
      }
    });

    const embed = new EmbedBuilder()
      .setTitle("Upcoming Absences")
      .setColor("#FF6B6B");

    if (datesWithAbsences.length === 0) {
      embed.setDescription(
        `🎉 No absences for the next ${interaction.options.getString(
          "number_of_weeks"
        )} raids! Everyone is available!`
      );
    } else {
      embed.addFields(
        datesWithAbsences.map(({ date, absences }) => ({
          name: label(date),
          value: absences.map((a) => a.globalName).join(", "),
        }))
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
