const {
  upcomingRaidDates,
  label,
  userAbsenceDates,
} = require("../../utils/raidDates");
const Absence = require("../../models/Absence");
const { addDays, nextThursday, nextSaturday, startOfDay } = require("date-fns");

describe("raidDates Utility Functions", () => {
  describe("upcomingRaidDates", () => {
    beforeEach(() => {
      // Mock current date to be consistent
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2025-07-23T10:00:00Z")); // Wednesday
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("should return correct number of raid dates", () => {
      const dates = upcomingRaidDates(2);
      expect(dates).toHaveLength(4); // 2 weeks * 2 days per week
    });

    test("should return dates in ascending order", () => {
      const dates = upcomingRaidDates(3);
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
      }
    });

    test("should include both Thursday and Saturday for each week", () => {
      const dates = upcomingRaidDates(1);
      expect(dates).toHaveLength(2);

      // Should be Thursday and Saturday
      expect(dates[0].getDay()).toBe(4); // Thursday
      expect(dates[1].getDay()).toBe(6); // Saturday
    });

    test("should return dates starting from start of day", () => {
      const dates = upcomingRaidDates(1);
      dates.forEach((date) => {
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
      });
    });

    test("should handle default parameter", () => {
      const dates = upcomingRaidDates();
      expect(dates).toHaveLength(8); // default 4 weeks * 2 days
    });
  });

  describe("label", () => {
    test("should format date correctly", () => {
      const date = new Date("2025-07-24T10:00:00Z"); // Thursday
      const result = label(date);
      expect(result).toBe("Thu Jul 24");
    });

    test("should handle different dates", () => {
      const thursdayDate = new Date("2025-07-24T10:00:00Z");
      const saturdayDate = new Date("2025-07-26T10:00:00Z");

      expect(label(thursdayDate)).toBe("Thu Jul 24");
      expect(label(saturdayDate)).toBe("Sat Jul 26");
    });
  });

  describe("userAbsenceDates", () => {
    const mockUser = {
      id: "user123",
      username: "testuser",
    };

    const mockInteraction = {
      guild: {
        id: "guild123",
      },
    };

    beforeEach(async () => {
      // Clean up any existing test data
      await Absence.deleteMany({});
    });

    test("should return empty array when user has no absences", async () => {
      const result = await userAbsenceDates(mockUser, mockInteraction);
      expect(result).toEqual([]);
    });

    test("should return user absence dates as ISO strings", async () => {
      const testDate1 = new Date("2025-07-24T00:00:00Z");
      const testDate2 = new Date("2025-07-26T00:00:00Z");

      // Create test absences
      await Absence.create({
        userId: mockUser.id,
        username: mockUser.username,
        globalName: mockUser.username,
        guildId: mockInteraction.guild.id,
        raidDate: testDate1,
      });

      await Absence.create({
        userId: mockUser.id,
        username: mockUser.username,
        globalName: mockUser.username,
        guildId: mockInteraction.guild.id,
        raidDate: testDate2,
      });

      const result = await userAbsenceDates(mockUser, mockInteraction);
      expect(result).toHaveLength(2);
      expect(result).toContain(testDate1.toISOString());
      expect(result).toContain(testDate2.toISOString());
    });

    test("should only return absences for specific user and guild", async () => {
      const testDate = new Date("2025-07-24T00:00:00Z");

      // Create absence for our user
      await Absence.create({
        userId: mockUser.id,
        username: mockUser.username,
        globalName: mockUser.username,
        guildId: mockInteraction.guild.id,
        raidDate: testDate,
      });

      // Create absence for different user
      await Absence.create({
        userId: "otheruser",
        username: "otheruser",
        globalName: "otheruser",
        guildId: mockInteraction.guild.id,
        raidDate: testDate,
      });

      // Create absence for different guild
      await Absence.create({
        userId: mockUser.id,
        username: mockUser.username,
        globalName: mockUser.username,
        guildId: "otherguild",
        raidDate: testDate,
      });

      const result = await userAbsenceDates(mockUser, mockInteraction);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(testDate.toISOString());
    });
  });
});
