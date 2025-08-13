const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Absence = require("../../models/Absence");
const { upcomingRaidDates, label } = require("../../utils/raidDates");
const { getRaidEligibleMembers, getRaidRoleDisplayText } = require("../../utils/roleFilter");

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

    // Get raid-eligible members
    const eligibleMembers = await getRaidEligibleMembers(interaction.guild);
    const eligibleUserIds = new Set(eligibleMembers.map(member => member.id));

    // Get all absences for the dates concurrently, then filter only dates with absences
    const absenceResults = await Promise.all(
      dates.map(async (date) => {
        const allAbsences = await Absence.find({
          raidDate: date,
          guildId: interaction.guild.id,
        })
          .lean()
          .exec();
          
        // Filter absences to only include raid-eligible users
        const filteredAbsences = allAbsences.filter(absence => 
          eligibleUserIds.has(absence.userId)
        );
        
        return { date, absences: filteredAbsences };
      })
    );

    // Filter to only include dates with absences
    const datesWithAbsences = absenceResults.filter(
      (result) => result.absences.length > 0
    );

    const roleDisplayText = await getRaidRoleDisplayText(interaction.guild);

    const embed = new EmbedBuilder()
      .setTitle("Upcoming Absences")
      .setDescription(`Showing absences for: **${roleDisplayText}**`)
      .setColor("#FF6B6B");

    if (datesWithAbsences.length === 0) {
      embed.addFields({
        name: "🎉 No Absences Found",
        value: `No absences for the next ${dates.length} raids! Everyone is available!`,
        inline: false
      });
    } else {
      embed.addFields(
        datesWithAbsences.map(({ date, absences }) => ({
          name: label(date),
          value: absences.map((a) => a.globalName).join(", "),
          inline: false
        }))
      );
    }

    await interaction.reply({ embeds: [embed] });
  },
};
