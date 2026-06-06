import { COMPETITIVE_CITIES, MAJOR_GROUPS } from "./colleges";

export function selectCollegesForStudent(allColleges, profile) {
  const group = MAJOR_GROUPS[profile.major] || "undecided";
  const testScore = getBestTestScore(profile);

  const scored = allColleges.map(c => {
    const isGroupMatch = (c.strongGroups || []).includes(group);
    const satDiff = Math.abs(testScore - c.satMid);
    const relevance = (isGroupMatch ? 200 : 0) - satDiff * 0.3;
    return { ...c, relevance };
  });

  scored.sort((a, b) => b.relevance - a.relevance);

  const testForTier = (c) => {
    const diff = testScore - c.satMid;
    if (diff >= 80) return "Safety";
    if (diff >= -80) return "Match";
    return "Reach";
  };

  const reaches  = scored.filter(c => testForTier(c) === "Reach").slice(0, 6);
  const matches  = scored.filter(c => testForTier(c) === "Match").slice(0, 8);
  const safeties = scored.filter(c => testForTier(c) === "Safety").slice(0, 6);

  const combined = [...reaches, ...matches, ...safeties];
  const seen = new Set();
  return combined.filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  }).slice(0, 20);
}

function getBestTestScore(profile) {
  const { sat, act, psat, usedSAT, usedACT, usedPSAT } = profile;
  let best = 0;
  if (usedSAT  && sat  > 0) best = Math.max(best, sat);
  if (usedACT  && act  > 0) best = Math.max(best, act * 44.4 + 14);
  if (usedPSAT && psat > 0) best = Math.max(best, psat * 1.045);
  if (best === 0) best = sat > 0 ? sat : (act * 44.4 + 14);
  return best;
}

export function scoreCollege(college, profile) {
  const {
    gpa, weightedGpa,
    apCourses, honorsCourses, majorRelatedCourses,
    leadershipRoles, ecScore, essayScore, major,
    awards, languageYears,
    hsCity, hsState, hsType, majorGroup,
  } = profile;

  const testScore = getBestTestScore(profile);
  const acceptRate = college.acceptRate;

  // ── Reality anchor: start from the actual acceptance rate ──
  // Most people have roughly the school's base accept rate as their starting point
  // Only exceptional profiles push significantly above this
  const baseChance = acceptRate;

  // ── Test score delta — very harsh for elite schools ──
  const satDiff = (testScore - college.satMid) / 100;
  let testMult;
  if (satDiff >= 2.0)       testMult =  3.5;   // well above median → big boost
  else if (satDiff >= 1.0)  testMult =  2.0;
  else if (satDiff >= 0.5)  testMult =  1.3;
  else if (satDiff >= 0)    testMult =  1.0;   // right at median → no change
  else if (satDiff >= -0.5) testMult =  0.65;  // slightly below → real penalty
  else if (satDiff >= -1.0) testMult =  0.35;
  else if (satDiff >= -1.5) testMult =  0.15;
  else                      testMult =  0.05;  // well below → almost no chance

  // ── GPA delta ──
  const gpaDiff = (gpa - college.gpaMid) / 0.3;
  let gpaMult;
  if (gpaDiff >= 1.0)       gpaMult = 1.4;
  else if (gpaDiff >= 0.3)  gpaMult = 1.15;
  else if (gpaDiff >= 0)    gpaMult = 1.0;
  else if (gpaDiff >= -0.5) gpaMult = 0.75;
  else if (gpaDiff >= -1.0) gpaMult = 0.45;
  else                      gpaMult = 0.20;

  // ── Base score after test + GPA reality check ──
  let score = baseChance * testMult * gpaMult;

  // ── Additive bonuses (small, realistic) ──
  const apBoost        = Math.min(apCourses.length * 0.002, 0.025);
  const honorsBoost    = Math.min(honorsCourses.length * 0.001, 0.010);
  const majorCourseBoost = Math.min((majorRelatedCourses || []).filter(c => c.trim()).length * 0.002, 0.008);

  const leadershipAvg  = leadershipRoles.length > 0
    ? leadershipRoles.reduce((a, b) => a + b.score, 0) / leadershipRoles.length / 10
    : 0;
  const leadershipBoost = leadershipAvg * 0.02;

  const awardsBoost    = Math.min((awards || []).reduce((sum, a) => sum + (a.score / 10) * 0.005, 0), 0.03);

  const langYears      = Object.values(languageYears || {});
  const maxLangYears   = langYears.length > 0 ? Math.max(...langYears) : 0;
  const langBoost      = maxLangYears >= 3 ? 0.008 : maxLangYears >= 2 ? 0.004 : 0;

  const ecNorm         = (ecScore || 5) / 10;
  const essayNorm      = (essayScore || 5) / 10;
  const ecBoost        = ecNorm * college.ecWeight * 0.025;
  const essayBoost     = essayNorm * college.essayWeight * 0.015;

  const majorBoost     = (college.strongGroups || []).includes(majorGroup) ? 0.005 : 0;

  // ── Location (in-state for public) ──
  let locationBoost = 0;
  if (college.isPublic && college.state === hsState)  locationBoost =  0.06;
  else if (college.isPublic && college.state !== hsState) locationBoost = -0.02;

  // ── Competitive high school penalty ──
  let hsPenalty = 0;
  const cityLower = (hsCity || "").toLowerCase();
  const isCompetitiveCity = COMPETITIVE_CITIES.some(c => cityLower.includes(c));
  if (isCompetitiveCity) hsPenalty += 0.01;
  if (hsType === "magnet")   hsPenalty += 0.01;
  if (hsType === "boarding") hsPenalty += 0.008;
  if (hsType === "private")  hsPenalty += 0.005;

  score += apBoost + honorsBoost + majorCourseBoost
         + leadershipBoost + awardsBoost + langBoost
         + ecBoost + essayBoost + majorBoost
         + locationBoost - hsPenalty;

  // ── Hard caps by accept rate ──
  // Nobody should show 40% at Stanford — cap elite schools tightly
  let maxPct;
  if (acceptRate <= 0.05)      maxPct = 22;   // Ivies/MIT/Stanford: max ~22%
  else if (acceptRate <= 0.10) maxPct = 35;
  else if (acceptRate <= 0.20) maxPct = 55;
  else if (acceptRate <= 0.40) maxPct = 75;
  else if (acceptRate <= 0.65) maxPct = 90;
  else                         maxPct = 97;

  let pct = score * 100;
  pct = Math.min(maxPct, Math.max(1, pct));

  const tier = pct >= 60 ? "Safety" : pct >= 25 ? "Match" : "Reach";
  return { ...college, pct: Math.round(pct), tier };
}

