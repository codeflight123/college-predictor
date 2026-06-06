import { COMPETITIVE_CITIES } from "./collegesData";

export function scoreCollege(college, profile) {
  const {
    sat, act, gpa, weightedGpa,
    apCourses, honorsCourses, majorRelatedCourses,
    leadershipRoles, ecScore, essayScore, major,
    awards, languages, languageYears,
    hsCity, hsState, hsType,
  } = profile;

  const testScore = sat > 0 ? sat : act * 44.4 + 14;

  // ── Test score ──
  const satDiff = (testScore - college.satMid) / 100;
  let testBonus;
  if (satDiff >= 1.5)       testBonus =  0.18;
  else if (satDiff >= 0.5)  testBonus =  0.10;
  else if (satDiff >= 0)    testBonus =  0.04;
  else if (satDiff >= -0.5) testBonus = -0.08;
  else if (satDiff >= -1.0) testBonus = -0.18;
  else                      testBonus = -0.30;

  // ── GPA ──
  const gpaDiff = (gpa - college.gpaMid) / 0.3;
  let gpaBonus;
  if (gpaDiff >= 1)         gpaBonus =  0.10;
  else if (gpaDiff >= 0)    gpaBonus =  0.04;
  else if (gpaDiff >= -0.5) gpaBonus = -0.08;
  else if (gpaDiff >= -1)   gpaBonus = -0.16;
  else                      gpaBonus = -0.25;

  const wGpaBonus = Math.max(0, (weightedGpa - 4.0) / 5.0) * 0.04;

  // ── Course rigor ──
  const apBoost = Math.min(apCourses.length * 0.008, 0.07);
  const honorsBoost = Math.min(honorsCourses.length * 0.004, 0.03);
  const majorCourseBoost = Math.min((majorRelatedCourses || []).filter(c => c.trim()).length * 0.01, 0.04);

  // ── Leadership ──
  const leadershipAvg = leadershipRoles.length > 0
    ? leadershipRoles.reduce((a, b) => a + b.score, 0) / leadershipRoles.length / 10
    : 0;
  const leadershipBonus = leadershipAvg * college.ecWeight * 0.07;

  // ── Awards ──
  const awardsBonus = Math.min(
    (awards || []).reduce((sum, a) => sum + (a.score / 10) * 0.015, 0), 0.10
  );

  // ── Languages (UC boost) ──
  const langYears = Object.values(languageYears || {});
  const maxLangYears = langYears.length > 0 ? Math.max(...langYears) : 0;
  let langBonus = 0;
  if (maxLangYears >= 3) langBonus = 0.03;
  else if (maxLangYears >= 2) langBonus = 0.015;
  if (college.isPublic && college.state === "CA") langBonus *= 1.5;

  // ── EC & Essay ──
  const ecNorm = (ecScore || 5) / 10;
  const essayNorm = (essayScore || 5) / 10;
  const ecBonus = ecNorm * college.ecWeight * 0.07;
  const essayBonus = essayNorm * college.essayWeight * 0.06;

  // ── Major fit ──
  const majorBonus = college.strongMajors?.includes(major) ? 0.02 : 0;

  // ── In-state for public schools ──
  let locationBonus = 0;
  if (college.isPublic && college.state === hsState) {
    locationBonus = 0.12;
  } else if (college.isPublic && college.state !== hsState) {
    locationBonus = -0.03;
  }

  // ── High school competitiveness penalty ──
  // If from a known competitive city/school type, harder curve
  let hsPenalty = 0;
  const cityLower = (hsCity || "").toLowerCase();
  const isCompetitiveCity = COMPETITIVE_CITIES.some(c => cityLower.includes(c));
  if (isCompetitiveCity) hsPenalty += 0.04;
  if (hsType === "magnet") hsPenalty += 0.04;
  if (hsType === "boarding") hsPenalty += 0.03;
  if (hsType === "private") hsPenalty += 0.02;

  // ── Base start from real accept rate ──
  let baseStart;
  if (college.acceptRate <= 0.05)      baseStart = 0.03;
  else if (college.acceptRate <= 0.10) baseStart = 0.06;
  else if (college.acceptRate <= 0.20) baseStart = 0.12;
  else if (college.acceptRate <= 0.40) baseStart = 0.25;
  else if (college.acceptRate <= 0.60) baseStart = 0.45;
  else                                 baseStart = 0.65;

  let score = baseStart
    + testBonus + gpaBonus + wGpaBonus
    + apBoost + honorsBoost + majorCourseBoost
    + leadershipBonus + awardsBonus + langBonus
    + ecBonus + essayBonus + majorBonus
    + locationBonus - hsPenalty;

  let pct = score * 100;
  pct = Math.min(96, Math.max(1, pct));

  const tier = pct >= 60 ? "Safety" : pct >= 25 ? "Match" : "Reach";
  return { ...college, pct: Math.round(pct), tier };
}
