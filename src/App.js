import { useState } from "react";
import {
  COLLEGES, MAJORS, AP_COURSES, HONORS_COURSES,
  LEADERSHIP_ROLES, US_STATES, LANGUAGES, AWARDS,
  MAJOR_EC_SUGGESTIONS, MAJOR_GROUPS
} from "./colleges";
import { scoreCollege, selectCollegesForStudent, getBestTestScore } from "./scoring";
import { groqChat } from "./groq";

const tierColor = { Reach: "#e74c3c", Match: "#f39c12", Safety: "#27ae60" };
const tierBg   = { Reach: "#fdecea", Match: "#fef9e7", Safety: "#eafaf1" };
const STEPS = ["School Info", "Scores & GPA", "Courses", "Activities", "Essay", "Results"];

const s = {
  page: { minHeight: "100vh", background: "#f4f5fb", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  wrap: { maxWidth: 720, margin: "0 auto", padding: "40px 20px" },
  card: { background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 24 },
  h2: { marginTop: 0, fontSize: 18, color: "#1a1a2e", fontWeight: 700 },
  h3: { fontSize: 14, color: "#444", fontWeight: 700, margin: "20px 0 10px" },
  label: { fontSize: 13, color: "#555", fontWeight: 600 },
  input: { width: "100%", padding: "10px 14px", fontSize: 15, border: "1px solid #ddd", borderRadius: 8, marginTop: 6, boxSizing: "border-box" },
  tag: (active, color = "#6c63ff") => ({
    padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "none",
    background: active ? color : "#f0f0f0",
    color: active ? "#fff" : "#555", fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
  }),
  row: { display: "flex", gap: 16, marginBottom: 20 },
  divider: { borderTop: "1px solid #f0f0f0", margin: "20px 0" },
};

function PrimaryBtn({ children, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", padding: "13px 0", background: disabled ? "#ccc" : "#6c63ff",
      color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
      fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", marginTop: 16,
    }}>{children}</button>
  );
}
function SecBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "11px 0", background: "#f0f0f0", color: "#333",
      border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 8,
    }}>{children}</button>
  );
}
function SliderRow({ label, value, min, max, step, unit = "", onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={s.label}>{label}</label>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#6c63ff" }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "#6c63ff" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}
function SectionLabel({ children, count }) {
  return (
    <p style={{ fontSize: 13, color: "#555", fontWeight: 600, marginBottom: 10, marginTop: 20 }}>
      {children}{count !== undefined && <span style={{ color: "#6c63ff" }}> ({count} selected)</span>}
    </p>
  );
}
function TagCloud({ items, selected, onToggle, color }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
      {items.map(item => {
        const key = typeof item === "string" ? item : item.label;
        const isActive = selected.length === 0 ? false :
          typeof selected[0] === "string" ? selected.includes(key) : !!selected.find(x => x.label === key);
        return <button key={key} style={s.tag(isActive, color || "#6c63ff")} onClick={() => onToggle(item)}>{key}</button>;
      })}
    </div>
  );
}
function ToggleRow({ label, value, onChange, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
        <div onClick={() => onChange(!value)} style={{
          width: 44, height: 24, borderRadius: 12, background: value ? "#6c63ff" : "#ddd",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 10, background: "#fff",
            position: "absolute", top: 2, left: value ? 22 : 2, transition: "left 0.2s",
          }} />
        </div>
        <div>
          <span style={{ fontSize: 14, color: "#333", fontWeight: 500 }}>{label}</span>
          {hint && <p style={{ margin: 0, fontSize: 11, color: "#888" }}>{hint}</p>}
        </div>
      </label>
    </div>
  );
}
function InfoBox({ children, color = "#5b52cc", bg = "#f0eeff" }) {
  return (
    <div style={{ background: bg, borderRadius: 10, padding: 14, marginBottom: 16 }}>
      <p style={{ margin: 0, fontSize: 12, color, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}
function Select({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...s.input, marginTop: 6 }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    hsName: "", hsCity: "", hsState: "", hsType: "public",
    hsCompetitiveness: null, hsApOffered: null, hsLookupDone: false, hsLookupLoading: false,
    classRankKnown: "unknown", classRank: "unknown",
    usedSAT: true, usedACT: false, usedPSAT: false,
    sat: 1200, act: 27, psat: 1100,
    satMath: 0, satEbrw: 0,
    apCourses: [], apScores: {}, honorsCourses: [], majorRelatedCourses: [],
    languages: [], languageYears: {},
    leadershipRoles: [], awards: [],
    ecList: [{ activity: "", years: 1, role: "", hoursPerWeek: 2, relatedToMajor: false, description: "" }],
    research: false, researchDescription: "",
    publications: false,
    major: "Undecided",
    essay: "",
    ecScore: null, essayScore: null, ecFeedback: null, essayFeedback: null,
    // New personal parameters
    isFirstGen: false,
    isLegacy: false, legacySchools: [],
    isRecruited: false, recruitedSport: "", athleteLevel: "varsity",
    demonstratedInterest: "none",
    gender: "prefer_not",
    ethnicity: "prefer_not",
    isInternational: false,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");

  const update = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  function toggleString(key, item) {
    setProfile(p => {
      const arr = p[key];
      return { ...p, [key]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item] };
    });
  }
  function toggleObj(key, item, idField = "label") {
    setProfile(p => {
      const arr = p[key];
      const exists = arr.find(x => x[idField] === item[idField]);
      return { ...p, [key]: exists ? arr.filter(x => x[idField] !== item[idField]) : [...arr, item] };
    });
  }
  function updateEc(i, field, val) {
    setProfile(p => {
      const list = [...p.ecList];
      list[i] = { ...list[i], [field]: val };
      return { ...p, ecList: list };
    });
  }

  // ── Groq: lookup high school info ──
  async function lookupSchool() {
    if (!profile.hsName || !profile.hsCity || !profile.hsState) return;
    update("hsLookupLoading", true);
    try {
      const res = await groqChat(
        `You are a US high school expert. Given a high school name and location, provide:
1. Approximate number of AP courses offered (integer)
2. Academic competitiveness rating 1-10 vs national average (10 = most competitive like TJ/Stuyvesant)
3. One sentence description of the school

Respond EXACTLY in this format with no other text:
AP_OFFERED: [number]
COMPETITIVENESS: [number]
DESCRIPTION: [one sentence]`,
        `School: ${profile.hsName}, ${profile.hsCity}, ${profile.hsState}`
      );
      const apMatch = res.match(/AP_OFFERED:\s*(\d+)/);
      const compMatch = res.match(/COMPETITIVENESS:\s*(\d+)/);
      const descMatch = res.match(/DESCRIPTION:\s*(.+)/);
      setProfile(p => ({
        ...p,
        hsApOffered: apMatch ? parseInt(apMatch[1]) : 10,
        hsCompetitiveness: compMatch ? parseInt(compMatch[1]) : 5,
        hsDescription: descMatch ? descMatch[1].trim() : "",
        hsLookupDone: true,
        hsLookupLoading: false,
      }));
    } catch (e) {
      update("hsLookupLoading", false);
    }
  }

  async function scoreEssay() {
    if (!profile.essay || profile.essay.length < 100) return;
    setLoading(true);
    setLoadingMsg("Grading your essay with Llama 3...");
    try {
      const res = await groqChat(
        `You are an experienced college admissions counselor. Read this college essay and give:
1. A score out of 10
2. What the essay does well (2-3 sentences)
3. What could be improved (2-3 sentences)
4. An overall verdict (1 sentence)

Format your response exactly like this:
SCORE: X/10
STRENGTHS: ...
IMPROVEMENTS: ...
VERDICT: ...`,
        profile.essay
      );
      const scoreMatch = res.match(/SCORE:\s*(\d+)/);
      const strengthsMatch = res.match(/STRENGTHS:\s*(.+?)(?=IMPROVEMENTS:)/s);
      const improvementsMatch = res.match(/IMPROVEMENTS:\s*(.+?)(?=VERDICT:)/s);
      const verdictMatch = res.match(/VERDICT:\s*(.+)/s);
      update("essayScore", scoreMatch ? parseInt(scoreMatch[1]) : 7);
      update("essayFeedback", {
        strengths: strengthsMatch ? strengthsMatch[1].trim() : "",
        improvements: improvementsMatch ? improvementsMatch[1].trim() : "",
        verdict: verdictMatch ? verdictMatch[1].trim() : res,
      });
    } catch (e) {
      update("essayScore", 0);
      update("essayFeedback", { strengths: "", improvements: "", verdict: "Error contacting AI." });
    }
    setLoading(false);
  }

  async function scoreECs() {
    const filled = profile.ecList.filter(e => e.activity.trim());
    if (filled.length === 0) { update("ecScore", 5); setStep(4); return; }
    setLoading(true);
    setLoadingMsg("Scoring your extracurriculars with Llama 3...");
    try {
      const ecText = filled.map((e, i) =>
        `${i+1}. ${e.activity} | ${e.years} yr(s) | ${e.hoursPerWeek}h/week | Role: ${e.role} | Major-related: ${e.relatedToMajor ? "Yes" : "No"}${e.description ? ` | Notes: ${e.description}` : ""}`
      ).join("\n");
      const extras = [];
      if (profile.research) extras.push(`Research experience${profile.researchDescription ? `: ${profile.researchDescription}` : ""}`);
      if (profile.publications) extras.push("Published work");
      const res = await groqChat(
        `You are a college admissions expert. Student is applying for ${profile.major}. Score their extracurricular profile 1-10, weighing major-relevant activities higher, hours/week commitment, and leadership. Awards to consider: ${(profile.awards||[]).map(a=>a.label).join(", ") || "none"}.

Format exactly:
SCORE: X/10
STRENGTHS: ...
IMPROVEMENTS: ...`,
        ecText + (extras.length ? "\nAdditional: " + extras.join(", ") : "")
      );
      const scoreMatch = res.match(/SCORE:\s*(\d+)/);
      const strengthsMatch = res.match(/STRENGTHS:\s*(.+?)(?=IMPROVEMENTS:)/s);
      const improvementsMatch = res.match(/IMPROVEMENTS:\s*(.+)/s);
      update("ecScore", scoreMatch ? parseInt(scoreMatch[1]) : 6);
      update("ecFeedback", {
        strengths: strengthsMatch ? strengthsMatch[1].trim() : "",
        improvements: improvementsMatch ? improvementsMatch[1].trim() : "",
      });
    } catch (e) {
      update("ecScore", 5);
      update("ecFeedback", { strengths: "", improvements: "Error contacting AI." });
    }
    setLoading(false);
    setStep(4);
  }

  function compute() {
    const majorGroup = MAJOR_GROUPS[profile.major] || "undecided";
    const profileWithGroup = { ...profile, majorGroup };
    const selected = selectCollegesForStudent(COLLEGES, profileWithGroup);
    const res = selected.map(c => scoreCollege(c, profileWithGroup)).sort((a, b) => b.pct - a.pct);
    setResults(res);
    setStep(5);
  }

  const ecSuggestions = MAJOR_EC_SUGGESTIONS[profile.major] || MAJOR_EC_SUGGESTIONS["default"] || [];

  const bestTestLabel = () => {
    const parts = [];
    if (profile.usedSAT && profile.sat > 0) parts.push(`SAT ${profile.sat}`);
    if (profile.usedACT && profile.act > 0) parts.push(`ACT ${profile.act}`);
    if (profile.usedPSAT && profile.psat > 0) parts.push(`PSAT ${profile.psat}`);
    return parts.join(" · ") || "None";
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "#1a1a2e", letterSpacing: -0.5 }}>
            🎓 College Admission Predictor
          </h1>
          <p style={{ color: "#888", marginTop: 8, fontSize: 15 }}>
            AI-powered predictions across 90+ US universities — tailored to your full profile
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 2, marginBottom: 5, background: i <= step ? "#6c63ff" : "#ddd", transition: "background 0.3s" }} />
              <span style={{ fontSize: 10, color: i <= step ? "#6c63ff" : "#aaa", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── STEP 0: School Info ── */}
        {step === 0 && (
          <div style={s.card}>
            <h2 style={s.h2}>Your High School</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>High School Name</label>
              <input style={s.input} placeholder="e.g. Thomas Jefferson High School"
                value={profile.hsName} onChange={e => update("hsName", e.target.value)} />
            </div>

            <div style={s.row}>
              <div style={{ flex: 2 }}>
                <label style={s.label}>City / Town</label>
                <input style={s.input} placeholder="e.g. Alexandria"
                  value={profile.hsCity} onChange={e => update("hsCity", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.label}>State</label>
                <select value={profile.hsState} onChange={e => update("hsState", e.target.value)}
                  style={{ ...s.input, marginTop: 6 }}>
                  <option value="">Select...</option>
                  {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>High School Type</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {[
                  { val: "public", label: "🏫 Public" },
                  { val: "private", label: "🏛️ Private" },
                  { val: "charter", label: "📚 Charter" },
                  { val: "magnet", label: "🔬 Magnet/STEM" },
                  { val: "boarding", label: "🎒 Boarding" },
                ].map(t => (
                  <button key={t.val} onClick={() => update("hsType", t.val)} style={{
                    padding: "9px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `2px solid ${profile.hsType === t.val ? "#6c63ff" : "#ddd"}`,
                    background: profile.hsType === t.val ? "#6c63ff" : "#fff",
                    color: profile.hsType === t.val ? "#fff" : "#555", cursor: "pointer",
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            {/* Groq school lookup */}
            <button onClick={lookupSchool} disabled={profile.hsLookupLoading || !profile.hsName || !profile.hsCity || !profile.hsState}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 10, fontSize: 14, fontWeight: 600,
                border: "2px dashed #a78bfa", background: "#faf5ff", color: "#7c3aed",
                cursor: "pointer", marginBottom: 12,
              }}>
              {profile.hsLookupLoading ? "🔍 Looking up your school..." : "🔍 Auto-detect School Competitiveness with AI"}
            </button>

            {profile.hsLookupDone && (
              <div style={{ background: "#f0eeff", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#5b52cc" }}>
                  📊 School Profile Detected
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#333" }}>
                  <strong>AP Courses Offered:</strong> {profile.hsApOffered}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#333" }}>
                  <strong>Competitiveness:</strong> {profile.hsCompetitiveness}/10
                </p>
                {profile.hsDescription && (
                  <p style={{ margin: 0, fontSize: 12, color: "#666", fontStyle: "italic" }}>
                    {profile.hsDescription}
                  </p>
                )}
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#888" }}>
                  Not accurate? You can adjust these manually below.
                </p>
                <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#555" }}>AP Courses Offered</label>
                    <input type="number" min={0} max={50} style={{ ...s.input, marginTop: 4 }}
                      value={profile.hsApOffered || ""}
                      onChange={e => update("hsApOffered", parseInt(e.target.value))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#555" }}>Competitiveness (1-10)</label>
                    <input type="number" min={1} max={10} style={{ ...s.input, marginTop: 4 }}
                      value={profile.hsCompetitiveness || ""}
                      onChange={e => update("hsCompetitiveness", parseInt(e.target.value))} />
                  </div>
                </div>
              </div>
            )}

            {/* Class rank */}
            <div style={s.divider} />
            <h3 style={s.h3}>Class Rank</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                { val: "unknown", label: "Don't know" },
                { val: "norank", label: "School doesn't rank" },
                { val: "know", label: "I know my rank" },
              ].map(o => (
                <button key={o.val} onClick={() => update("classRankKnown", o.val)} style={{
                  padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: `2px solid ${profile.classRankKnown === o.val ? "#6c63ff" : "#ddd"}`,
                  background: profile.classRankKnown === o.val ? "#6c63ff" : "#fff",
                  color: profile.classRankKnown === o.val ? "#fff" : "#555", cursor: "pointer",
                }}>{o.label}</button>
              ))}
            </div>
            {profile.classRankKnown === "know" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { val: "top1", label: "Top 1%" },
                  { val: "top5", label: "Top 5%" },
                  { val: "top10", label: "Top 10%" },
                  { val: "top25", label: "Top 25%" },
                  { val: "top50", label: "Top 50%" },
                ].map(o => (
                  <button key={o.val} onClick={() => update("classRank", o.val)} style={{
                    padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `2px solid ${profile.classRank === o.val ? "#27ae60" : "#ddd"}`,
                    background: profile.classRank === o.val ? "#27ae60" : "#fff",
                    color: profile.classRank === o.val ? "#fff" : "#555", cursor: "pointer",
                  }}>{o.label}</button>
                ))}
              </div>
            )}

            {/* Personal factors */}
            <div style={s.divider} />
            <h3 style={s.h3}>Personal Background</h3>
            <InfoBox>These factors are real considerations in holistic admissions. All information is used only to improve prediction accuracy.</InfoBox>

            <Select label="Gender" value={profile.gender} onChange={v => update("gender", v)} options={[
              { value: "prefer_not", label: "Prefer not to say" },
              { value: "female", label: "Female" },
              { value: "male", label: "Male" },
              { value: "nonbinary", label: "Non-binary / Other" },
            ]} />

            <Select label="Ethnicity" value={profile.ethnicity} onChange={v => update("ethnicity", v)} options={[
              { value: "prefer_not", label: "Prefer not to say" },
              { value: "white", label: "White / Caucasian" },
              { value: "asian", label: "Asian / Asian-American" },
              { value: "black", label: "Black / African-American" },
              { value: "hispanic", label: "Hispanic / Latino" },
              { value: "native", label: "Native American / Alaska Native" },
              { value: "pacific", label: "Pacific Islander" },
              { value: "multiracial", label: "Multiracial" },
              { value: "other", label: "Other" },
            ]} />

            <ToggleRow label="First Generation College Student"
              hint="Neither parent holds a 4-year college degree"
              value={profile.isFirstGen} onChange={v => update("isFirstGen", v)} />

            <ToggleRow label="International Student"
              hint="Non-US citizen / permanent resident"
              value={profile.isInternational} onChange={v => update("isInternational", v)} />

            {/* Legacy */}
            <ToggleRow label="Legacy Applicant"
              hint="Parent or grandparent attended one of your target colleges"
              value={profile.isLegacy} onChange={v => update("isLegacy", v)} />
            {profile.isLegacy && (
              <div style={{ background: "#fff8e1", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600, color: "#92400e" }}>
                  Which colleges? (type names separated by commas)
                </p>
                <input style={s.input}
                  placeholder="e.g. Harvard, Yale, Princeton"
                  value={(profile.legacySchools || []).join(", ")}
                  onChange={e => update("legacySchools", e.target.value.split(",").map(s2 => s2.trim()).filter(Boolean))} />
              </div>
            )}

            {/* Recruited athlete */}
            <ToggleRow label="Recruited Athlete"
              hint="Actively being recruited by college coaches"
              value={profile.isRecruited} onChange={v => update("isRecruited", v)} />
            {profile.isRecruited && (
              <div style={{ background: "#f0fdf4", borderRadius: 10, padding: 14, marginBottom: 12 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 12, color: "#555" }}>Sport</label>
                  <input style={s.input} placeholder="e.g. Swimming, Soccer, Tennis"
                    value={profile.recruitedSport}
                    onChange={e => update("recruitedSport", e.target.value)} />
                </div>
                <label style={{ fontSize: 12, color: "#555" }}>Athlete Level</label>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  {[
                    { val: "national", label: "🥇 National" },
                    { val: "state", label: "🥈 State" },
                    { val: "regional", label: "🥉 Regional" },
                    { val: "varsity", label: "Varsity" },
                  ].map(o => (
                    <button key={o.val} onClick={() => update("athleteLevel", o.val)} style={{
                      padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      border: `2px solid ${profile.athleteLevel === o.val ? "#16a34a" : "#ddd"}`,
                      background: profile.athleteLevel === o.val ? "#16a34a" : "#fff",
                      color: profile.athleteLevel === o.val ? "#fff" : "#555", cursor: "pointer",
                    }}>{o.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Demonstrated interest */}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Demonstrated Interest</label>
              <p style={{ fontSize: 11, color: "#888", margin: "4px 0 8px" }}>
                Some schools (Northeastern, Tulane, etc.) heavily track this.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { val: "none", label: "None" },
                  { val: "emailed", label: "📧 Emailed admissions" },
                  { val: "visited", label: "🏫 Campus visit" },
                  { val: "interview", label: "🎤 Alumni interview" },
                ].map(o => (
                  <button key={o.val} onClick={() => update("demonstratedInterest", o.val)} style={{
                    padding: "7px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `2px solid ${profile.demonstratedInterest === o.val ? "#6c63ff" : "#ddd"}`,
                    background: profile.demonstratedInterest === o.val ? "#6c63ff" : "#fff",
                    color: profile.demonstratedInterest === o.val ? "#fff" : "#555", cursor: "pointer",
                  }}>{o.label}</button>
                ))}
              </div>
            </div>

            <PrimaryBtn onClick={() => setStep(1)}>Next: Scores & GPA →</PrimaryBtn>
          </div>
        )}

        {/* ── STEP 1: Scores & GPA ── */}
        {step === 1 && (
          <div style={s.card}>
            <h2 style={s.h2}>Scores & GPA</h2>

            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Intended Major</label>
              <select value={profile.major} onChange={e => update("major", e.target.value)}
                style={{ ...s.input, marginTop: 6 }}>
                {MAJORS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Tests Taken (select all that apply)</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {[
                  { key: "usedSAT", label: "SAT" },
                  { key: "usedACT", label: "ACT" },
                  { key: "usedPSAT", label: "PSAT / NMSQT" },
                ].map(t => (
                  <button key={t.key} onClick={() => update(t.key, !profile[t.key])} style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: `2px solid ${profile[t.key] ? "#6c63ff" : "#ddd"}`,
                    background: profile[t.key] ? "#6c63ff" : "#fff",
                    color: profile[t.key] ? "#fff" : "#555", cursor: "pointer",
                  }}>{t.label}</button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>We use your highest equivalent score.</p>
            </div>

            {profile.usedSAT && (
              <>
                <SliderRow label="SAT Total Score" value={profile.sat} min={400} max={1600} step={10} onChange={v => update("sat", v)} />
                <div style={s.row}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>SAT Math</label>
                    <input type="number" min={200} max={800} style={s.input}
                      placeholder="e.g. 750"
                      value={profile.satMath || ""}
                      onChange={e => update("satMath", parseInt(e.target.value))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>SAT EBRW (Reading/Writing)</label>
                    <input type="number" min={200} max={800} style={s.input}
                      placeholder="e.g. 720"
                      value={profile.satEbrw || ""}
                      onChange={e => update("satEbrw", parseInt(e.target.value))} />
                  </div>
                </div>
              </>
            )}
            {profile.usedACT && (
              <SliderRow label="ACT Composite Score" value={profile.act} min={1} max={36} step={1} onChange={v => update("act", v)} />
            )}
            {profile.usedPSAT && (
              <>
                <SliderRow label="PSAT / NMSQT Score" value={profile.psat} min={320} max={1520} step={10} onChange={v => update("psat", v)} />
                <InfoBox color="#92400e" bg="#fff8e1">
                  💡 National Merit Semifinalist cutoffs are typically 1450–1520 depending on your state. PSAT is converted to SAT equivalent for predictions.
                </InfoBox>
              </>
            )}

            <SliderRow label="Unweighted GPA (out of 4.0)" value={profile.gpa} min={1.0} max={4.0} step={0.05} onChange={v => update("gpa", v)} />
            <SliderRow label="Weighted GPA (out of 5.0)" value={profile.weightedGpa} min={1.0} max={5.0} step={0.05} onChange={v => update("weightedGpa", v)} />

            <SecBtn onClick={() => setStep(0)}>← Back</SecBtn>
            <PrimaryBtn onClick={() => setStep(2)}>Next: Courses →</PrimaryBtn>
          </div>
        )}

        {/* ── STEP 2: Courses ── */}
        {step === 2 && (
          <div style={s.card}>
            <h2 style={s.h2}>Courses & Languages</h2>

            <SectionLabel count={profile.apCourses.length}>AP Courses</SectionLabel>
            {profile.hsApOffered && (
              <p style={{ fontSize: 12, color: "#888", marginTop: -8, marginBottom: 10 }}>
                Your school offers ~{profile.hsApOffered} AP courses. Taking more of what's available looks stronger.
              </p>
            )}
            <TagCloud items={AP_COURSES} selected={profile.apCourses} onToggle={c => toggleString("apCourses", c)} />

            {/* AP Scores */}
            {profile.apCourses.length > 0 && (
              <div style={{ background: "#f9f9f9", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <p style={{ ...s.label, marginBottom: 10 }}>AP Exam Scores (optional — leave blank if not yet taken)</p>
                {profile.apCourses.map(course => (
                  <div key={course} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 13, flex: 1, color: "#333" }}>{course}</span>
                    <select value={profile.apScores[course] || ""}
                      onChange={e => update("apScores", { ...profile.apScores, [course]: parseInt(e.target.value) || "" })}
                      style={{ ...s.input, width: 80, marginTop: 0, padding: "6px 10px" }}>
                      <option value="">—</option>
                      <option value="5">5</option>
                      <option value="4">4</option>
                      <option value="3">3</option>
                      <option value="2">2</option>
                      <option value="1">1</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <SectionLabel count={profile.honorsCourses.length}>Honors Courses</SectionLabel>
            <TagCloud items={HONORS_COURSES} selected={profile.honorsCourses} onToggle={c => toggleString("honorsCourses", c)} />

            <SectionLabel count={profile.majorRelatedCourses.filter(c => c.trim()).length}>
              Courses Related to {profile.major}
            </SectionLabel>
            <p style={{ fontSize: 12, color: "#888", marginTop: -8, marginBottom: 10 }}>
              Any additional school courses directly related to your intended major.
            </p>
            {profile.majorRelatedCourses.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input style={{ ...s.input, marginTop: 0, flex: 1 }}
                  placeholder={`e.g. Intro to ${profile.major}...`}
                  value={c} onChange={e => {
                    const arr = [...profile.majorRelatedCourses];
                    arr[i] = e.target.value;
                    update("majorRelatedCourses", arr);
                  }} />
                <button onClick={() => update("majorRelatedCourses", profile.majorRelatedCourses.filter((_, j) => j !== i))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button onClick={() => update("majorRelatedCourses", [...profile.majorRelatedCourses, ""])}
              style={{ fontSize: 13, color: "#6c63ff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              + Add course
            </button>

            <div style={{ marginTop: 24 }}>
              <SectionLabel count={profile.languages.length}>Foreign Languages</SectionLabel>
              <p style={{ fontSize: 12, color: "#888", marginTop: -8, marginBottom: 10 }}>
                UC schools require 2+ years. Select all you study or have studied.
              </p>
              <TagCloud items={LANGUAGES} selected={profile.languages}
                onToggle={l => toggleString("languages", l)} color="#0891b2" />
              {profile.languages.length > 0 && (
                <div style={{ background: "#f0f9ff", borderRadius: 10, padding: 14, marginTop: 8 }}>
                  <p style={{ ...s.label, marginBottom: 12 }}>Years studied per language</p>
                  {profile.languages.map(lang => (
                    <div key={lang} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, minWidth: 120, fontWeight: 500 }}>{lang}</span>
                      <input type="number" min={1} max={8} style={{ ...s.input, width: 70, marginTop: 0 }}
                        value={profile.languageYears[lang] || 1}
                        onChange={e => update("languageYears", { ...profile.languageYears, [lang]: parseInt(e.target.value) })} />
                      <span style={{ fontSize: 12, color: "#888" }}>years</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <SecBtn onClick={() => setStep(1)}>← Back</SecBtn>
            <PrimaryBtn onClick={() => setStep(3)}>Next: Activities →</PrimaryBtn>
          </div>
        )}

        {/* ── STEP 3: Activities ── */}
        {step === 3 && (
          <div style={s.card}>
            <h2 style={s.h2}>Activities, Awards & Research</h2>

            <SectionLabel count={profile.leadershipRoles.length}>Leadership Roles</SectionLabel>
            <TagCloud items={LEADERSHIP_ROLES} selected={profile.leadershipRoles}
              onToggle={r => toggleObj("leadershipRoles", r)} />

            <div style={s.divider} />
            <SectionLabel count={profile.awards.length}>Awards & Honors</SectionLabel>
            {["academic","stem","arts","athletics","community"].map(cat => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 0 }}>{cat}</p>
                <TagCloud items={AWARDS.filter(a => a.category === cat)} selected={profile.awards}
                  onToggle={a => toggleObj("awards", a)} color="#7c3aed" />
              </div>
            ))}

            <div style={s.divider} />
            <h3 style={s.h3}>Research & Publications</h3>
            <ToggleRow label="Research Experience"
              hint="Lab research, independent study, internship with research component"
              value={profile.research} onChange={v => update("research", v)} />
            {profile.research && (
              <div style={{ marginBottom: 12 }}>
                <input style={s.input} placeholder="Briefly describe your research (lab, topic, duration)..."
                  value={profile.researchDescription}
                  onChange={e => update("researchDescription", e.target.value)} />
              </div>
            )}
            <ToggleRow label="Published Work"
              hint="Paper, article, book, or research published in a journal or recognized outlet"
              value={profile.publications} onChange={v => update("publications", v)} />

            <div style={s.divider} />
            <SectionLabel>Extracurricular Activities</SectionLabel>

            <div style={{ background: "#f0eeff", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#5b52cc" }}>
                💡 Suggested ECs for {profile.major}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ecSuggestions.map(sug => (
                  <button key={sug} onClick={() => {
                    if (!profile.ecList.find(e => e.activity === sug)) {
                      update("ecList", [...profile.ecList, { activity: sug, years: 1, hoursPerWeek: 3, role: "Member", relatedToMajor: true, description: "" }]);
                    }
                  }} style={{
                    padding: "4px 10px", borderRadius: 14, fontSize: 12, cursor: "pointer",
                    border: "1px dashed #a78bfa", background: "#faf5ff", color: "#7c3aed",
                  }}>+ {sug}</button>
                ))}
              </div>
            </div>

            {profile.ecList.map((ec, i) => (
              <div key={i} style={{ background: "#f9f9f9", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Activity {i + 1}</span>
                  {profile.ecList.length > 1 && (
                    <button onClick={() => update("ecList", profile.ecList.filter((_, j) => j !== i))}
                      style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "3px 8px", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>
                      Remove
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: "#888" }}>Activity / Club / Sport / Organization</label>
                  <input style={s.input} placeholder="e.g. Varsity Soccer, Robotics Club, Research Lab"
                    value={ec.activity} onChange={e => updateEc(i, "activity", e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#888" }}>Years</label>
                    <input type="number" min={1} max={4} style={s.input}
                      value={ec.years} onChange={e => updateEc(i, "years", parseInt(e.target.value))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#888" }}>Hrs/week</label>
                    <input type="number" min={1} max={40} style={s.input}
                      value={ec.hoursPerWeek} onChange={e => updateEc(i, "hoursPerWeek", parseInt(e.target.value))} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 12, color: "#888" }}>Your Role</label>
                    <input style={s.input} placeholder="e.g. Founder, Captain, Lead Developer"
                      value={ec.role} onChange={e => updateEc(i, "role", e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: "#888" }}>Key achievement or impact (optional)</label>
                  <input style={s.input} placeholder="e.g. Led team to state finals, raised $5k for charity..."
                    value={ec.description} onChange={e => updateEc(i, "description", e.target.value)} />
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={ec.relatedToMajor}
                    onChange={e => updateEc(i, "relatedToMajor", e.target.checked)} />
                  <span style={{ color: "#555" }}>Related to {profile.major}</span>
                </label>
              </div>
            ))}
            <button onClick={() => update("ecList", [...profile.ecList, { activity: "", years: 1, hoursPerWeek: 2, role: "", relatedToMajor: false, description: "" }])}
              style={{ fontSize: 13, color: "#6c63ff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              + Add another activity
            </button>

            {profile.ecFeedback && (
              <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: "#6c63ff", padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>EC Score</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{profile.ecScore}/10</span>
                </div>
                <div style={{ background: "#f9f9f9", padding: 16 }}>
                  {profile.ecFeedback.strengths && <div style={{ marginBottom: 10 }}><p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#27ae60" }}>✅ STRENGTHS</p><p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{profile.ecFeedback.strengths}</p></div>}
                  {profile.ecFeedback.improvements && <div><p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#e67e22" }}>⚠️ IMPROVEMENTS</p><p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{profile.ecFeedback.improvements}</p></div>}
                </div>
              </div>
            )}

            <SecBtn onClick={() => setStep(2)}>← Back</SecBtn>
            <PrimaryBtn onClick={scoreECs} disabled={loading}>
              {loading ? loadingMsg : "Score My ECs with AI →"}
            </PrimaryBtn>
          </div>
        )}

        {/* ── STEP 4: Essay ── */}
        {step === 4 && (
          <div style={s.card}>
            <h2 style={s.h2}>College Essay</h2>
            <p style={{ fontSize: 13, color: "#888", marginTop: -8, marginBottom: 16 }}>
              Paste your Common App personal statement below for AI grading.
            </p>
            <textarea rows={12} placeholder="Paste your essay here (minimum 100 characters)..."
              value={profile.essay} onChange={e => update("essay", e.target.value)}
              style={{ ...s.input, resize: "vertical", lineHeight: 1.6 }} />

            {profile.essayFeedback && (
              <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: "#6c63ff", padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>Essay Grade</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{profile.essayScore}/10</span>
                </div>
                <div style={{ background: "#f9f9f9", padding: 16 }}>
                  {profile.essayFeedback.strengths && <div style={{ marginBottom: 12 }}><p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#27ae60" }}>✅ STRENGTHS</p><p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{profile.essayFeedback.strengths}</p></div>}
                  {profile.essayFeedback.improvements && <div style={{ marginBottom: 12 }}><p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#e67e22" }}>⚠️ IMPROVEMENTS</p><p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{profile.essayFeedback.improvements}</p></div>}
                  {profile.essayFeedback.verdict && <div><p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6c63ff" }}>🎯 VERDICT</p><p style={{ margin: 0, fontSize: 13, color: "#333", lineHeight: 1.6 }}>{profile.essayFeedback.verdict}</p></div>}
                </div>
              </div>
            )}

            <SecBtn onClick={() => setStep(3)}>← Back</SecBtn>
            <PrimaryBtn onClick={scoreEssay} disabled={loading || profile.essay.length < 100}>
              {loading ? loadingMsg : "Grade My Essay with AI ✍️"}
            </PrimaryBtn>
            <PrimaryBtn onClick={compute} disabled={!profile.essayScore}>
              {profile.essayScore ? "Predict My Colleges 🚀" : "Grade essay first"}
            </PrimaryBtn>
            <button onClick={compute} style={{ width: "100%", background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", marginTop: 8, padding: "8px 0" }}>
              Skip essay → predict anyway
            </button>
          </div>
        )}

        {/* ── STEP 5: Results ── */}
        {step === 5 && results && (
          <>
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#666", fontWeight: 600 }}>Your Profile Summary</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  ["School", profile.hsName || "—"],
                  ["Location", `${profile.hsCity || "—"}, ${profile.hsState || "—"}`],
                  ["Type", profile.hsType],
                  ["HS Competitiveness", profile.hsCompetitiveness ? `${profile.hsCompetitiveness}/10` : "—"],
                  ["APs Available", profile.hsApOffered || "—"],
                  ["Major", profile.major],
                  ["Tests", bestTestLabel()],
                  ["UW GPA", profile.gpa],
                  ["W GPA", profile.weightedGpa],
                  ["APs Taken", profile.apCourses.length],
                  ["Honors", profile.honorsCourses.length],
                  ["Awards", profile.awards.length],
                  ["Languages", profile.languages.length],
                  ["EC Score", `${profile.ecScore || "?"}/10`],
                  ["Essay", `${profile.essayScore || "?"}/10`],
                  ...(profile.isFirstGen ? [["First Gen", "✅"]] : []),
                  ...(profile.isLegacy ? [["Legacy", "✅"]] : []),
                  ...(profile.isRecruited ? [["Recruited", profile.recruitedSport]] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f4f5fb", borderRadius: 8, padding: "6px 12px" }}>
                    <span style={{ fontSize: 11, color: "#888" }}>{k} </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              {["Safety","Match","Reach"].map(tier => (
                <div key={tier} style={{ flex: 1, background: tierBg[tier], borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: tierColor[tier] }}>{results.filter(r => r.tier === tier).length}</div>
                  <div style={{ fontSize: 12, color: tierColor[tier], fontWeight: 600 }}>{tier}</div>
                </div>
              ))}
            </div>

            <InfoBox>
              🎯 Showing <strong>{results.length} colleges</strong> selected for <strong>{profile.major}</strong> from our database of 90+ schools.
            </InfoBox>

            {["Reach","Match","Safety"].map(tier => (
              <div key={tier} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tierColor[tier] }} />
                  <h3 style={{ margin: 0, color: tierColor[tier], fontSize: 15, fontWeight: 700 }}>{tier} Schools</h3>
                </div>
                {results.filter(r => r.tier === tier).map(r => (
                  <div key={r.name} style={{
                    background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 10,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderLeft: `4px solid ${tierColor[tier]}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
                        {r.isPublic && <span style={{ fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Public</span>}
                        {(r.strongGroups || []).includes(MAJOR_GROUPS[profile.major]) && (
                          <span style={{ fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Strong for {profile.major}</span>
                        )}
                        {profile.isLegacy && (profile.legacySchools || []).includes(r.name) && (
                          <span style={{ fontSize: 11, background: "#fef3c7", color: "#92400e", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>👑 Legacy</span>
                        )}
                      </div>
                      <span style={{ background: tierBg[tier], color: tierColor[tier], fontWeight: 800, fontSize: 17, padding: "3px 14px", borderRadius: 20 }}>{r.pct}%</span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5 }}>
                      <div style={{ width: `${r.pct}%`, height: 5, borderRadius: 99, background: tierColor[tier] }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>Avg SAT: {r.satMid}</span>
                      <span>Accept rate: {Math.round(r.acceptRate * 100)}%</span>
                      <span>{r.location}</span>
                      <a href={`https://${r.website}`} target="_blank" rel="noreferrer"
                        style={{ color: "#6c63ff", textDecoration: "none" }}>Visit site ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <PrimaryBtn onClick={() => { setStep(0); setResults(null); }}>← Start Over</PrimaryBtn>
          </>
        )}

      </div>
    </div>
  );
}
