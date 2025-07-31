const Absence = require("../../models/Absence");

describe("Absence Model", () => {
  const validAbsenceData = {
    userId: "user123",
    username: "testuser",
    globalName: "Test User",
    guildId: "guild123",
    raidDate: new Date("2025-07-24T00:00:00Z"),
  };

  beforeEach(async () => {
    // Clean up before each test
    await Absence.deleteMany({});
  });

  describe("Schema Validation", () => {
    test("should create absence with valid data", async () => {
      const absence = new Absence(validAbsenceData);
      const savedAbsence = await absence.save();

      expect(savedAbsence.userId).toBe(validAbsenceData.userId);
      expect(savedAbsence.username).toBe(validAbsenceData.username);
      expect(savedAbsence.globalName).toBe(validAbsenceData.globalName);
      expect(savedAbsence.guildId).toBe(validAbsenceData.guildId);
      expect(savedAbsence.raidDate).toEqual(validAbsenceData.raidDate);
      expect(savedAbsence.createdAt).toBeDefined();
    });

    test("should require userId field", async () => {
      const absenceData = { ...validAbsenceData };
      delete absenceData.userId;

      const absence = new Absence(absenceData);
      await expect(absence.save()).rejects.toThrow();
    });

    test("should require username field", async () => {
      const absenceData = { ...validAbsenceData };
      delete absenceData.username;

      const absence = new Absence(absenceData);
      await expect(absence.save()).rejects.toThrow();
    });

    test("should require globalName field", async () => {
      const absenceData = { ...validAbsenceData };
      delete absenceData.globalName;

      const absence = new Absence(absenceData);
      await expect(absence.save()).rejects.toThrow();
    });

    test("should require guildId field", async () => {
      const absenceData = { ...validAbsenceData };
      delete absenceData.guildId;

      const absence = new Absence(absenceData);
      await expect(absence.save()).rejects.toThrow();
    });

    test("should require raidDate field", async () => {
      const absenceData = { ...validAbsenceData };
      delete absenceData.raidDate;

      const absence = new Absence(absenceData);
      await expect(absence.save()).rejects.toThrow();
    });

    test("should set createdAt automatically", async () => {
      const absence = new Absence(validAbsenceData);
      const savedAbsence = await absence.save();

      expect(savedAbsence.createdAt).toBeDefined();
      expect(savedAbsence.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("Database Operations", () => {
    test("should find absence by userId and raidDate", async () => {
      await Absence.create(validAbsenceData);

      const found = await Absence.findOne({
        userId: validAbsenceData.userId,
        raidDate: validAbsenceData.raidDate,
      });

      expect(found).toBeTruthy();
      expect(found.userId).toBe(validAbsenceData.userId);
    });

    test("should update existing absence", async () => {
      const absence = await Absence.create(validAbsenceData);

      const newGlobalName = "Updated Name";
      absence.globalName = newGlobalName;
      await absence.save();

      const updated = await Absence.findById(absence._id);
      expect(updated.globalName).toBe(newGlobalName);
    });

    test("should delete absence", async () => {
      const absence = await Absence.create(validAbsenceData);
      await Absence.deleteOne({ _id: absence._id });

      const found = await Absence.findById(absence._id);
      expect(found).toBeNull();
    });

    test("should handle upsert operation", async () => {
      const query = {
        userId: validAbsenceData.userId,
        raidDate: validAbsenceData.raidDate,
      };

      // First upsert - should create new document
      await Absence.updateOne(query, validAbsenceData, { upsert: true });
      let found = await Absence.findOne(query);
      expect(found).toBeTruthy();

      // Second upsert - should update existing document
      const updatedData = { ...validAbsenceData, globalName: "Updated Name" };
      await Absence.updateOne(query, updatedData, { upsert: true });
      found = await Absence.findOne(query);
      expect(found.globalName).toBe("Updated Name");

      // Should still be only one document
      const count = await Absence.countDocuments(query);
      expect(count).toBe(1);
    });
  });

  describe("Queries", () => {
    beforeEach(async () => {
      // Create test data
      const testDate1 = new Date("2025-07-24T00:00:00Z");
      const testDate2 = new Date("2025-07-26T00:00:00Z");
      const testDate3 = new Date("2025-07-31T00:00:00Z");

      await Absence.create([
        { ...validAbsenceData, raidDate: testDate1 },
        { ...validAbsenceData, userId: "user456", raidDate: testDate2 },
        { ...validAbsenceData, guildId: "guild456", raidDate: testDate3 },
      ]);
    });

    test("should find absences by guild", async () => {
      const absences = await Absence.find({
        guildId: validAbsenceData.guildId,
      });
      expect(absences).toHaveLength(2);
    });

    test("should find absences by user", async () => {
      const absences = await Absence.find({ userId: validAbsenceData.userId });
      expect(absences).toHaveLength(2);
    });

    test("should find absences by date range", async () => {
      const startDate = new Date("2025-07-23T00:00:00Z");
      const endDate = new Date("2025-07-27T00:00:00Z");

      const absences = await Absence.find({
        raidDate: { $gte: startDate, $lte: endDate },
      });

      expect(absences).toHaveLength(2);
    });

    test("should sort absences by raidDate", async () => {
      const absences = await Absence.find({}).sort({ raidDate: 1 });

      for (let i = 1; i < absences.length; i++) {
        expect(absences[i].raidDate.getTime()).toBeGreaterThanOrEqual(
          absences[i - 1].raidDate.getTime()
        );
      }
    });
  });
});
