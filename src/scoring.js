import { COMPETITIVE_CITIES, MAJOR_GROUPS, DI_SCHOOLS } from "./colleges";

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

export function getBestTestScore(profile) {
  const { sat, act, psat, usedSAT, usedACT, usedPSAT } = profile;
  let best = 0;
  if (usedSAT  && sat  > 0) best = Math.max(best, sat);
  if (usedACT  && act  > 0) best = Math.max(best, act * 44.4 + 14);
  if (usedPSAT && psat > 0) best = Math.max(best, psat * 1.045);
  if (best === 0) best = sat > 0 ? sat : (act > 0 ? act * 44.4 + 14 : 1000);
  return best;
}

export function scoreCollege(college, profile) {
  const {
    gpa, weightedGpa,
    apCourses, honorsCourses, majorRelatedCourses,
    leadershipRoles, ecScore, essayScore, major, majorGroup,
    awards, languageYears,
    hsCity, hsState, hsType,
    hsCompetitiveness,   // 1-10 from Groq
    hsApOffered,         // number from Groq
    classRank,           // "top1","top5","top10","top25","top50","norank","unknown"
    // New personal parameters
    isFirstGen,          // bool
    isLegacy,            // bool
    legacySchools,       // array of college names
    isRecruited,         // bool
    recruitedSport,      // string
    athleteLevel,        // "national","state","regional","varsity","jv"
    demonstratedInterest,// "visited","emailed","interview","none"
    gender,              // "male","female","nonbinary","prefer_not"
    ethnicity,           // string
    isInternational,     // bool
  } = profile;

  const testScore = getBestTestScore(profile);
  const acceptRate = college.acceptRate;

  // ── Reality anchor: start from actual acceptance rate ──
  const baseChance = acceptRate;

  // ── Test score multiplier — very strict ──
  const satDiff = (testScore - college.satMid) / 100;
  let testMult;
  if (satDiff >= 2.0)       testMult = 3.5;
  else if (satDiff >= 1.0)  testMult = 2.0;
  else if (satDiff >= 0.5)  testMult = 1.3;
  else if (satDiff >= 0)    testMult = 1.0;
  else if (satDiff >= -0.5) testMult = 0.65;
  else if (satDiff >= -1.0) testMult = 0.35;
  else if (satDiff >= -1.5) testMult = 0.15;
  else                      testMult = 0.05;

  // ── GPA multiplier ──
  const gpaDiff = (gpa - college.gpaMid) / 0.3;
  let gpaMult;
  if (gpaDiff >= 1.0)       gpaMult = 1.4;
  else if (gpaDiff >= 0.3)  gpaMult = 1.15;
  else if (gpaDiff >= 0)    gpaMult = 1.0;
  else if (gpaDiff >= -0.5) gpaMult = 0.75;
  else if (gpaDiff >= -1.0) gpaMult = 0.45;
  else                      gpaMult = 0.20;

  let score = baseChance * testMult * gpaMult;

  // ── High school context adjustments ──
  // Groq-detected competitiveness: very competitive school = harder curve
  if (hsCompetitiveness) {
    const comp = parseFloat(hsCompetitiveness);
    if (comp >= 9)      score *= 0.88;  // TJ, Stuyvesant, etc.
    else if (comp >= 7) score *= 0.93;  // Strong competitive school
    else if (comp >= 5) score *= 1.0;   // Average
    else if (comp >= 3) score *= 1.05;  // Less competitive = slight boost (context)
  }

  // AP courses available context
  if (hsApOffered && apCourses) {
    const apOffered = parseInt(hsApOffered) || 10;
    const apTaken = apCourses.length;
    const apRatio = apTaken / Math.max(apOffered, 1);
    // Took more of what's available = better
    if (apRatio >= 0.7)      score += 0.015;
    else if (apRatio >= 0.5) score += 0.008;
    else if (apRatio >= 0.3) score += 0.003;
  }

  // ── Class rank ──
  if (classRank === "top1")       score += 0.030;
  else if (classRank === "top5")  score += 0.018;
  else if (classRank === "top10") score += 0.010;
  else if (classRank === "top25") score += 0.004;
  else if (classRank === "top50") score -= 0.005;
  // norank and unknown = no change

  // ── Course rigor ──
  const apBoost         = Math.min(apCourses.length * 0.002, 0.025);
  const honorsBoost     = Math.min(honorsCourses.length * 0.001, 0.010);
  const majorCourseBoost= Math.min((majorRelatedCourses || []).filter(c => c.trim()).length * 0.002, 0.008);

  // ── Leadership ──
  const leadershipAvg   = leadershipRoles.length > 0
    ? leadershipRoles.reduce((a, b) => a + b.score, 0) / leadershipRoles.length / 10 : 0;
  const leadershipBoost = leadershipAvg * 0.02;

  // ── Awards ──
  const awardsBoost     = Math.min((awards || []).reduce((sum, a) => sum + (a.score / 10) * 0.005, 0), 0.035);

  // ── Languages ──
  const langYears       = Object.values(languageYears || {});
  const maxLangYears    = langYears.length > 0 ? Math.max(...langYears) : 0;
  const langBoost       = maxLangYears >= 3 ? 0.008 : maxLangYears >= 2 ? 0.004 : 0;

  // ── EC & Essay ──
  const ecNorm          = (ecScore || 5) / 10;
  const essayNorm       = (essayScore || 5) / 10;
  const ecBoost         = ecNorm * college.ecWeight * 0.025;
  const essayBoost      = essayNorm * college.essayWeight * 0.015;

  // ── Major group fit ──
  const majorBoost      = (college.strongGroups || []).includes(majorGroup) ? 0.005 : 0;

  // ── First generation ──
  const firstGenBoost   = isFirstGen ? (acceptRate <= 0.15 ? 0.015 : 0.008) : 0;

  // ── Legacy ──
  let legacyBoost = 0;
  if (isLegacy && legacySchools && legacySchools.includes(college.name)) {
    const mult = college.legacyBoost || 1.0;
    legacyBoost = baseChance * (mult - 1) * 0.4; // partial legacy effect
  }

  // ── Recruited athlete ──
  let athleteBoost = 0;
  if (isRecruited && recruitedSport) {
    if (athleteLevel === "national")       athleteBoost = baseChance * 2.0;
    else if (athleteLevel === "state")     athleteBoost = baseChance * 0.8;
    else if (athleteLevel === "regional")  athleteBoost = baseChance * 0.4;
    else if (athleteLevel === "varsity")   athleteBoost = 0.015;
    athleteBoost = Math.min(athleteBoost, 0.25); // cap it
  }

  // ── Demonstrated interest ──
  let diBoost = 0;
  const schoolTracksDI = DI_SCHOOLS.includes(college.name) || college.diTracked;
  if (schoolTracksDI) {
    if (demonstratedInterest === "visited")       diBoost = 0.020;
    else if (demonstratedInterest === "emailed")  diBoost = 0.010;
    else if (demonstratedInterest === "interview")diBoost = 0.025;
  }

  // ── Gender (engineering/STEM schools actively recruit women) ──
  let genderBoost = 0;
  const isStemSchool = (college.strongGroups || []).some(g => ["cs_tech","engineering","math_science"].includes(g));
  if (gender === "female" && isStemSchool && acceptRate < 0.5) {
    genderBoost = 0.010;
  } else if (gender === "male" && (college.strongGroups || []).includes("bio_health") && acceptRate < 0.3) {
    genderBoost = 0.005; // nursing/health programs often seek male applicants
  }

  // ── Ethnicity (underrepresented at selective schools) ──
  let ethnicityBoost = 0;
  const isSelectiveSchool = acceptRate < 0.25;
  if (isSelectiveSchool) {
    if (ethnicity === "black" || ethnicity === "hispanic" || ethnicity === "native") {
      ethnicityBoost = baseChance * 0.3;
      ethnicityBoost = Math.min(ethnicityBoost, 0.04);
    }
    if (ethnicity === "asian" && acceptRate < 0.10) {
      ethnicityBoost = -0.005; // slightly more competitive pool at elite schools
    }
  }

  // ── International student ──
  const intlPenalty = isInternational ? (college.isPublic ? -0.03 : -0.01) : 0;

  // ── Location ──
  let locationBoost = 0;
  if (college.isPublic && college.state === hsState)       locationBoost =  0.06;
  else if (college.isPublic && college.state !== hsState)  locationBoost = -0.02;

  // ── Competitive city/school penalty ──
  let hsPenalty = 0;
  const cityLower = (hsCity || "").toLowerCase();
  const isCompetitiveCity = COMPETITIVE_CITIES.some(c => cityLower.includes(c));
  if (isCompetitiveCity)    hsPenalty += 0.008;
  if (hsType === "magnet")  hsPenalty += 0.010;
  if (hsType === "boarding")hsPenalty += 0.008;
  if (hsType === "private") hsPenalty += 0.005;

  score += apBoost + honorsBoost + majorCourseBoost
         + leadershipBoost + awardsBoost + langBoost
         + ecBoost + essayBoost + majorBoost
         + firstGenBoost + legacyBoost + athleteBoost
         + diBoost + genderBoost + ethnicityBoost
         + locationBoost - hsPenalty + intlPenalty;

  // ── Hard caps by accept rate ──
  let maxPct;
  if (acceptRate <= 0.05)       maxPct = 22;
  else if (acceptRate <= 0.10)  maxPct = 35;
  else if (acceptRate <= 0.20)  maxPct = 55;
  else if (acceptRate <= 0.40)  maxPct = 75;
  else if (acceptRate <= 0.65)  maxPct = 90;
  else                          maxPct = 97;

  // Legacy and recruited athletes can exceed normal caps slightly
  if (isLegacy && legacySchools && legacySchools.includes(college.name)) maxPct = Math.min(maxPct * 1.3, 95);
  if (isRecruited && athleteLevel === "national") maxPct = Math.min(maxPct * 1.5, 95);

  let pct = score * 100;
  pct = Math.min(maxPct, Math.max(1, pct));

  const tier = pct >= 60 ? "Safety" : pct >= 25 ? "Match" : "Reach";
  return { ...college, pct: Math.round(pct), tier };
}
