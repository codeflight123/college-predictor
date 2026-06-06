import { COMPETITIVE_CITIES, MAJOR_GROUPS } from "./colleges";

// Pick the best 15-20 colleges for this student based on their major and scores
export function selectCollegesForStudent(allColleges, profile) {
  const group = MAJOR_GROUPS[profile.major] || "undecided";
  const testScore = profile.sat > 0 ? profile.sat : profile.act * 44.4 + 14;

  // Score each college for relevance to this student
  const scored = allColleges.map(c => {
    const isGroupMatch = (c.strongGroups || []).includes(group);
    const satDiff = Math.abs(testScore - c.satMid);
    const relevance = (isGroupMatch ? 200 : 0) - satDiff * 0.3;
    return { ...c, relevance };
  });

  // Sort by relevance
  scored.sort((a, b) => b.relevance - a.relevance);

  // Always ensure a spread: top reach, match, safety
  const testForCollege = (c) => {
    const diff = testScore - c.satMid;
    if (diff >= 80) return "Safety";
    if (diff >= -80) return "Match";
    return "Reach";
  };

  const reaches = scored.filter(c => testForCollege(c) === "Reach").slice(0, 6);
  const matches = scored.filter(c => testForCollege(c) === "Match").slice(0, 8);
  const safeties = scored.filter(c => testForCollege(c) === "Safety").slice(0, 6);

  // Combine and return 15-20
  const combined = [...reaches, ...matches, ...safeties];
  // Deduplicate by name
  const seen = new Set();
  return combined.filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  }).slice(0, 20);
}

export function scoreCollege(college, profile) {
  const {
    sat, act, psat, usedSAT, usedACT, usedPSAT,
    gpa, weightedGpa,
    apCourses, honorsCourses, majorRelatedCourses,
    leadershipRoles, ecScore, essayScore, major,
    awards, languageYears,
    hsCity, hsState, hsType,
  } = profile;

  // Best test score — use highest equivalent SAT
  let testScore = 0;
  if (usedSAT && sat > 0) testScore = Math.max(testScore, sat);
  if (usedACT && act > 0) testScore = Math.max(testScore, act * 44.4 + 14);
  if (usedPSAT && psat > 0) testScore = Math.max(testScore, psat * 1.045); // PSAT ~95.7% of SAT
  if (testScore === 0) testScore = sat > 0 ? sat : act * 44.4 + 14;

  // ── Test score bonus ──
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

  // ── Languages ──
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

  // ── Major group fit ──
  const studentGroup = MAJOR_GROUPS[major] || "undecided";
  const majorBonus = (college.strongGroups || []).includes(studentGroup) ? 0.03 : 0;

  // ── In-state bonus for public schools ──
  let locationBonus = 0;
  if (college.isPublic && college.state === hsState) locationBonus = 0.12;
  else if (college.isPublic && college.state !== hsState) locationBonus = -0.03;

  // ── Competitive high school penalty ──
  let hsPenalty = 0;
  const cityLower = (hsCity || "").toLowerCase();
  const isCompetitiveCity = COMPETITIVE_CITIES.some(c => cityLower.includes(c));
  if (isCompetitiveCity) hsPenalty += 0.04;
  if (hsType === "magnet") hsPenalty += 0.04;
  if (hsType === "boarding") hsPenalty += 0.03;
  if (hsType === "private") hsPenalty += 0.02;

  // ── Base start from accept rate ──
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
