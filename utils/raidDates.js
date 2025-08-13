const {
  nextThursday,
  nextSaturday,
  addWeeks,
  startOfDay,
  format,
  compareAsc,
  compareDesc,
} = require("date-fns");
const Absence = require("../models/Absence");
const { isUserRaidEligible } = require("./roleFilter");

function upcomingRaidDates(weeks = 4) {
  const now = new Date();
  const list = [];

  for (let i = 0; i < weeks; i++) {
    list.push(startOfDay(nextThursday(addWeeks(now, i))));
    list.push(startOfDay(nextSaturday(addWeeks(now, i))));
  }
  return list.sort(compareAsc);
}

function label(date) {
  return format(date, "EEE MMM dd"); // e.g. “Thu Jul 24”
}

async function userAbsenceDates(targetUser, interaction) {
  // First check if the user is raid eligible
  const targetMember = await interaction.guild.members
    .fetch(targetUser.id)
    .catch(() => null);
  if (!targetMember) {
    return []; // User not in guild, no absences
  }

  const isEligible = await isUserRaidEligible(targetMember);
  if (!isEligible) {
    return []; // User not eligible, no absences to show
  }

  const userAbsences = await Absence.find({
    userId: targetUser.id,
    guildId: interaction.guild.id,
  });
  return userAbsences.map((absence) => absence.raidDate.toISOString());
}

// console.log(upcomingRaidDates(2).map(label)); // e.g. “Thu Jul 24, Sat Jul 27, Thu Jul 31, Sat Aug 3”
module.exports = { upcomingRaidDates, label, userAbsenceDates };
