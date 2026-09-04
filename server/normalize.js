/**
 * Normalization layer for student records.
 *
 * Every exported function is total: missing keys, null, undefined, wrong types
 * and unparseable junk never throw. Blank-ish input always normalizes to "".
 * Values we cannot confidently parse are returned trimmed as-is so that no
 * source data is destroyed.
 */

export const CANONICAL_FIELDS = [
  "studentId",
  "lastName",
  "firstName",
  "gradeLevel",
  "enrollDate",
  "elLevel",
  "district",
];

const MONTH_NAMES = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/**
 * Coerce an arbitrary value to a trimmed string.
 * null/undefined/objects/NaN => "". Non-string primitives are stringified.
 */
export function toTrimmedString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value).trim() : "";
  }
  if (typeof value === "boolean" || typeof value === "bigint") {
    return String(value).trim();
  }
  // objects, arrays, functions, symbols: no meaningful scalar representation
  return "";
}

/** Trim and collapse runs of internal whitespace to a single space. */
export function normalizeName(value) {
  const raw = toTrimmedString(value);
  if (!raw) return "";
  return raw.replace(/\s+/g, " ");
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year, month) {
  const lengths = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

// Oldest plausible school record; dates before this are treated as typos.
const MIN_YEAR = 1800;

// Allows pre-registration dates for the upcoming school year. Computed per
// call so a long-running server stays correct across a year boundary.
function maxYear() {
  return new Date().getFullYear() + 1;
}

function isValidYmd(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (year < MIN_YEAR || year > maxYear()) return false;
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

function formatYmd(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Parse a month-name form: "aug 15th 2006", "Aug 15, 2006", "August 15 2006",
 * "15 Aug 2006", "15-August-2006". Returns a yyyy-mm-dd string or null.
 */
function parseMonthNameDate(raw) {
  const tokens = raw
    .toLowerCase()
    .split(/[\s,./\\-]+/)
    .filter(Boolean);

  let month = null;
  const numbers = [];

  for (const token of tokens) {
    const cleaned = token.replace(/\.$/, "");
    if (Object.prototype.hasOwnProperty.call(MONTH_NAMES, cleaned)) {
      if (month !== null) return null; // two month names: not a date we understand
      month = MONTH_NAMES[cleaned];
      continue;
    }
    const numeric = /^(\d{1,4})(?:st|nd|rd|th)?$/.exec(cleaned);
    if (!numeric) return null; // unrecognized token: bail out rather than guess
    numbers.push({ value: Number(numeric[1]), digits: numeric[1].length });
  }

  if (month === null || numbers.length !== 2) return null;

  // The year is the 4-digit token (or the one too large to be a day).
  let yearToken = numbers.find((n) => n.digits === 4);
  if (!yearToken) yearToken = numbers.find((n) => n.value > 31);
  if (!yearToken) return null;

  const dayToken = numbers.find((n) => n !== yearToken);
  if (!dayToken) return null;

  const year = yearToken.value;
  const day = dayToken.value;
  if (!isValidYmd(year, month, day)) return null;
  return formatYmd(year, month, day);
}

/**
 * yyyy-mm-dd (also yyyy-m-d and `/` separators) with an OPTIONAL ISO time
 * suffix that we accept and then discard: "T00:00:00Z", " 14:30",
 * "T14:30:00.000-05:00". Only the date fields as written are used - we never
 * convert timezones on strings, so the calendar day can never shift.
 * A malformed suffix ("2006-08-15Txyz") fails the match entirely and falls
 * through to the pass-through path, preserving the original text.
 */
const ISO_DATE_RE =
  /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?(?:[Zz]|[+-](?:[01]\d|2[0-3]):?[0-5]\d)?)?$/;

/**
 * Normalize any reasonable date input to yyyy-mm-dd.
 * Blank => "". Unparseable => the trimmed input, unchanged.
 *
 * Numeric forms are treated as US month-first (08-15-2006 => 2006-08-15).
 * Parsing is hand-rolled; `new Date(string)` is deliberately avoided because
 * its behaviour for non-ISO strings is implementation/locale dependent.
 */
export function normalizeEnrollDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    // Date instances are read in UTC, the JSON/ISO convention: `new Date(
    // "2006-08-15")` is UTC midnight per spec, so local-time getters would
    // report 2006-08-14 on every machine west of UTC.
    const year = value.getUTCFullYear();
    const month = value.getUTCMonth() + 1;
    const day = value.getUTCDate();
    // A Date carries no original text to fall back on, and the range extremes
    // format as garbage ("275760-09-12", negative years), so blank them out.
    if (!isValidYmd(year, month, day)) return "";
    return formatYmd(year, month, day);
  }

  const raw = toTrimmedString(value);
  if (!raw) return "";

  // Already ISO-ish, with or without a time suffix (see ISO_DATE_RE).
  const iso = ISO_DATE_RE.exec(raw);
  if (iso) {
    const [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    if (isValidYmd(year, month, day)) return formatYmd(year, month, day);
    return raw;
  }

  // Compact yyyymmdd (string or number).
  const compact = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
  if (compact) {
    const [year, month, day] = [Number(compact[1]), Number(compact[2]), Number(compact[3])];
    if (isValidYmd(year, month, day)) return formatYmd(year, month, day);
    return raw;
  }

  // US numeric mm-dd-yyyy / mm/dd/yyyy / mm.dd.yyyy (month-first by rule).
  const us = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(raw);
  if (us) {
    const [month, day, year] = [Number(us[1]), Number(us[2]), Number(us[3])];
    if (isValidYmd(year, month, day)) return formatYmd(year, month, day);
    return raw;
  }

  const byName = parseMonthNameDate(raw);
  if (byName) return byName;

  // Unknown shape: keep the data, just tidied.
  return raw;
}

/**
 * Canonical grade level: "K" for kindergarten variants, "1".."12" for numeric
 * forms ("5", "05", "5th", "Grade 5", "grade 05", "5th grade").
 * Unparseable => the trimmed input, unchanged.
 */
export function normalizeGradeLevel(value) {
  const raw = toTrimmedString(value);
  if (!raw) return "";

  let s = raw.toLowerCase().replace(/[.,]/g, " ");
  s = s.replace(/^(grades?|gr)\s*/, "");
  s = s.replace(/\s*grades?$/, "");
  s = s.trim();

  if (/^(k|kg|kinder|kindergarten)$/.test(s)) return "K";

  const numeric = /^(\d{1,2})(?:st|nd|rd|th)?$/.exec(s);
  if (numeric) {
    const grade = Number(numeric[1]);
    if (grade >= 1 && grade <= 12) return String(grade);
  }

  return raw;
}

/**
 * EL level: plain numbers become their integer string ("3", "3.0", " 3 " => "3").
 * Anything else (e.g. "Level 3", "3.5") is returned trimmed as-is.
 */
export function normalizeElLevel(value) {
  const raw = toTrimmedString(value);
  if (!raw) return "";

  if (/^[+-]?\d+(?:\.\d+)?$/.test(raw)) {
    const num = Number(raw);
    if (Number.isFinite(num) && Number.isInteger(num)) return String(num);
  }

  return raw;
}

/** A record with all canonical fields present and blank. */
export function blankStudent() {
  const out = {};
  for (const field of CANONICAL_FIELDS) out[field] = "";
  return out;
}

/**
 * Normalize one record into exactly the 7 canonical fields.
 * Never throws: non-objects and missing keys yield blanks.
 */
export function normalizeStudent(record) {
  const source =
    record !== null && typeof record === "object" && !Array.isArray(record) ? record : {};

  return {
    studentId: toTrimmedString(source.studentId),
    lastName: normalizeName(source.lastName),
    firstName: normalizeName(source.firstName),
    gradeLevel: normalizeGradeLevel(source.gradeLevel),
    enrollDate: normalizeEnrollDate(source.enrollDate),
    elLevel: normalizeElLevel(source.elLevel),
    district: toTrimmedString(source.district),
  };
}

/** Normalize an array of records. Non-array input yields []. */
export function normalizeStudents(records) {
  if (!Array.isArray(records)) return [];
  return records.map((record) => normalizeStudent(record));
}
