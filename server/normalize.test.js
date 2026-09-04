import test from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_FIELDS,
  blankStudent,
  normalizeElLevel,
  normalizeEnrollDate,
  normalizeGradeLevel,
  normalizeName,
  normalizeStudent,
  normalizeStudents,
  toTrimmedString,
} from "./normalize.js";

test("enrollDate: yyyymmdd as string and as number", () => {
  assert.equal(normalizeEnrollDate("20260815"), "2026-08-15");
  assert.equal(normalizeEnrollDate(20260815), "2026-08-15");
  assert.equal(normalizeEnrollDate("  20060801  "), "2006-08-01");
});

test("enrollDate: month-name forms with and without ordinals", () => {
  assert.equal(normalizeEnrollDate("aug 15th 2006"), "2006-08-15");
  assert.equal(normalizeEnrollDate("Aug 15, 2006"), "2006-08-15");
  assert.equal(normalizeEnrollDate("August 15 2006"), "2006-08-15");
  assert.equal(normalizeEnrollDate("SEPTEMBER 1st 2006"), "2006-09-01");
  assert.equal(normalizeEnrollDate("Sept. 3rd, 2006"), "2006-09-03");
  assert.equal(normalizeEnrollDate("March 2nd 2006"), "2006-03-02");
});

test("enrollDate: day-first month-name form", () => {
  assert.equal(normalizeEnrollDate("15 Aug 2006"), "2006-08-15");
  assert.equal(normalizeEnrollDate("1 December 2006"), "2006-12-01");
  assert.equal(normalizeEnrollDate("15-Aug-2006"), "2006-08-15");
});

test("enrollDate: US numeric mm-dd-yyyy is month-first", () => {
  assert.equal(normalizeEnrollDate("08-15-2006"), "2006-08-15");
  assert.equal(normalizeEnrollDate("8/15/2006"), "2006-08-15");
  assert.equal(normalizeEnrollDate("8-5-2006"), "2006-08-05");
  assert.equal(normalizeEnrollDate("12/31/2006"), "2006-12-31");
  // month-first, not day-first: 01/02 is January 2nd
  assert.equal(normalizeEnrollDate("01/02/2006"), "2006-01-02");
});

test("enrollDate: ISO input passes through, zero-padded", () => {
  assert.equal(normalizeEnrollDate("2006-08-15"), "2006-08-15");
  assert.equal(normalizeEnrollDate("2006-8-5"), "2006-08-05");
  assert.equal(normalizeEnrollDate(" 2026-01-09 "), "2026-01-09");
});

test("enrollDate: leap day validity", () => {
  assert.equal(normalizeEnrollDate("02/29/2024"), "2024-02-29");
  // 2023 is not a leap year, so this is not a real date: keep it as-is
  assert.equal(normalizeEnrollDate("02/29/2023"), "02/29/2023");
});

test("enrollDate: blank-ish input becomes empty string", () => {
  assert.equal(normalizeEnrollDate(""), "");
  assert.equal(normalizeEnrollDate("   "), "");
  assert.equal(normalizeEnrollDate(null), "");
  assert.equal(normalizeEnrollDate(undefined), "");
});

test("enrollDate: unparseable values pass through trimmed (data preserved)", () => {
  assert.equal(normalizeEnrollDate("  not a date  "), "not a date");
  assert.equal(normalizeEnrollDate("fall semester"), "fall semester");
  assert.equal(normalizeEnrollDate("13/45/2006"), "13/45/2006");
  assert.equal(normalizeEnrollDate("20061399"), "20061399");
  assert.equal(normalizeEnrollDate("Aug 2006"), "Aug 2006");
});

test("enrollDate: Date instances are formatted, invalid Dates blank out", () => {
  assert.equal(normalizeEnrollDate(new Date(2006, 7, 15)), "2006-08-15");
  assert.equal(normalizeEnrollDate(new Date("nope")), "");
});

test("gradeLevel: kindergarten variants collapse to K", () => {
  for (const input of ["K", "k", " k ", "kinder", "Kindergarten", "KINDER", "Grade K"]) {
    assert.equal(normalizeGradeLevel(input), "K", `input: ${input}`);
  }
});

test("gradeLevel: numeric variants collapse to 1-12", () => {
  assert.equal(normalizeGradeLevel("5"), "5");
  assert.equal(normalizeGradeLevel("05"), "5");
  assert.equal(normalizeGradeLevel("5th"), "5");
  assert.equal(normalizeGradeLevel("Grade 5"), "5");
  assert.equal(normalizeGradeLevel("grade 05"), "5");
  assert.equal(normalizeGradeLevel("  12  "), "12");
  assert.equal(normalizeGradeLevel("1st"), "1");
  assert.equal(normalizeGradeLevel("3rd grade"), "3");
  assert.equal(normalizeGradeLevel(5), "5");
});

test("gradeLevel: blank and unparseable handling", () => {
  assert.equal(normalizeGradeLevel(""), "");
  assert.equal(normalizeGradeLevel(null), "");
  assert.equal(normalizeGradeLevel(undefined), "");
  assert.equal(normalizeGradeLevel("   "), "");
  assert.equal(normalizeGradeLevel("  ungraded  "), "ungraded");
  assert.equal(normalizeGradeLevel("14"), "14");
});

test("elLevel: plain numbers become integer strings", () => {
  assert.equal(normalizeElLevel("3"), "3");
  assert.equal(normalizeElLevel("3.0"), "3");
  assert.equal(normalizeElLevel(" 3 "), "3");
  assert.equal(normalizeElLevel("03"), "3");
  assert.equal(normalizeElLevel(3), "3");
  assert.equal(normalizeElLevel(0), "0");
});

test("elLevel: blank and non-numeric handling", () => {
  assert.equal(normalizeElLevel(""), "");
  assert.equal(normalizeElLevel(null), "");
  assert.equal(normalizeElLevel(undefined), "");
  assert.equal(normalizeElLevel("  "), "");
  assert.equal(normalizeElLevel("  Level 3  "), "Level 3");
  assert.equal(normalizeElLevel("3.5"), "3.5");
});

test("names: trimmed and internal whitespace collapsed", () => {
  assert.equal(normalizeName("  Ada  "), "Ada");
  assert.equal(normalizeName("Van    der   Berg"), "Van der Berg");
  assert.equal(normalizeName("Mary\t Jo\n Ann"), "Mary Jo Ann");
  assert.equal(normalizeName(""), "");
  assert.equal(normalizeName(null), "");
  assert.equal(normalizeName(undefined), "");
});

test("toTrimmedString: coerces non-string primitives, blanks out non-scalars", () => {
  assert.equal(toTrimmedString(1234), "1234");
  assert.equal(toTrimmedString(true), "true");
  assert.equal(toTrimmedString("  abc  "), "abc");
  assert.equal(toTrimmedString(null), "");
  assert.equal(toTrimmedString(undefined), "");
  assert.equal(toTrimmedString(NaN), "");
  assert.equal(toTrimmedString({}), "");
  assert.equal(toTrimmedString([]), "");
});

test("normalizeStudent returns exactly the 7 canonical fields", () => {
  const result = normalizeStudent({ firstName: "Ada", extra: "drop me", nested: { a: 1 } });
  assert.deepEqual(Object.keys(result).sort(), [...CANONICAL_FIELDS].sort());
  assert.equal(result.firstName, "Ada");
  assert.equal(Object.prototype.hasOwnProperty.call(result, "extra"), false);
});

test("normalizeStudent: full record normalizes every field", () => {
  const result = normalizeStudent({
    studentId: 100234,
    lastName: "  Van   der Berg ",
    firstName: "  Ada  Grace ",
    gradeLevel: "Grade 05",
    enrollDate: "aug 15th 2006",
    elLevel: " 3.0 ",
    district: "  Springfield USD  ",
  });
  assert.deepEqual(result, {
    studentId: "100234",
    lastName: "Van der Berg",
    firstName: "Ada Grace",
    gradeLevel: "5",
    enrollDate: "2006-08-15",
    elLevel: "3",
    district: "Springfield USD",
  });
});

test("normalizeStudent: missing keys, null and undefined never throw", () => {
  assert.deepEqual(normalizeStudent({}), blankStudent());
  assert.deepEqual(normalizeStudent(null), blankStudent());
  assert.deepEqual(normalizeStudent(undefined), blankStudent());
  assert.deepEqual(normalizeStudent("nonsense"), blankStudent());
  assert.deepEqual(normalizeStudent(42), blankStudent());
  assert.deepEqual(normalizeStudent([1, 2, 3]), blankStudent());
  assert.deepEqual(
    normalizeStudent({
      studentId: null,
      lastName: undefined,
      firstName: "   ",
      gradeLevel: null,
      enrollDate: undefined,
      elLevel: "",
      district: null,
    }),
    blankStudent(),
  );
});

test("normalizeStudent: all-blank record (matches seeded db shape)", () => {
  const seeded = {
    studentId: "",
    lastName: "",
    firstName: "",
    gradeLevel: "",
    enrollDate: "",
    elLevel: "",
    district: "",
  };
  assert.deepEqual(normalizeStudent(seeded), blankStudent());
});

test("normalizeStudents maps over an array", () => {
  const result = normalizeStudents([
    { firstName: " Ann ", enrollDate: "8/15/2006", gradeLevel: "kinder" },
    { firstName: " Bo ", enrollDate: "20260815", gradeLevel: "12th" },
  ]);
  assert.equal(result.length, 2);
  assert.equal(result[0].firstName, "Ann");
  assert.equal(result[0].enrollDate, "2006-08-15");
  assert.equal(result[0].gradeLevel, "K");
  assert.equal(result[1].enrollDate, "2026-08-15");
  assert.equal(result[1].gradeLevel, "12");
});

test("normalizeStudents: non-array input returns []", () => {
  for (const input of [null, undefined, {}, "abc", 7, true]) {
    assert.deepEqual(normalizeStudents(input), [], `input: ${JSON.stringify(input) ?? "undefined"}`);
  }
});

test("normalizeStudents: non-object entries become all-blank records", () => {
  const result = normalizeStudents([null, undefined, "x", 5, [], { firstName: "Ada" }]);
  assert.equal(result.length, 6);
  for (let i = 0; i < 5; i += 1) {
    assert.deepEqual(result[i], blankStudent(), `entry ${i}`);
  }
  assert.equal(result[5].firstName, "Ada");
});

test("normalizeStudents: empty array stays empty", () => {
  assert.deepEqual(normalizeStudents([]), []);
});
