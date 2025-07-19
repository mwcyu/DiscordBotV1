const {
  nextThursday,
  nextSaturday,
  addWeeks,
  startOfDay,
  format,
  compareAsc,
  compareDesc,
} = require("date-fns");

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
  return format(date, "EEE MMM d"); // e.g. “Thu Jul 24”
}

module.exports = { upcomingRaidDates, label };
