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
        .setRequired(false)
        .addChoices(
          ...Array.from({ length: 8 }, (_, i) => ({
            name: `${i + 1}`,
            value: (i + 1).toString(),
          }))
        )
    ),

  async execute(interaction) {
    const dates = upcomingRaidDates(
      interaction.options.getString("number_of_weeks") || "10"
    );

    // Get all absences for the dates concurrently, then filter only dates with absences
    const absenceResults = await Promise.all(
      dates.map(async (date) => {
        const absences = await Absence.find({
          raidDate: date,
          guildId: interaction.guild.id,
        })
          .lean()
          .exec();
        return { date, absences };
      })
    );

    // Filter to only include dates with absences
    const datesWithAbsences = absenceResults.filter(
      (result) => result.absences.length > 0
    );

    const embed = new EmbedBuilder()
      .setTitle("Upcoming Absences")
      .setColor("#FF6B6B");

    if (datesWithAbsences.length === 0) {
      embed.setDescription(
        `🎉 No absences for the next ${dates.length} raids! Everyone is available!`
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
