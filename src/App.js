import { useState } from "react";
import {
  COLLEGES, MAJORS, AP_COURSES, HONORS_COURSES,
  LEADERSHIP_ROLES, US_STATES, LANGUAGES, AWARDS, MAJOR_EC_SUGGESTIONS, MAJOR_GROUPS
} from "./colleges";
import { scoreCollege, selectCollegesForStudent } from "./scoring";
import { groqChat } from "./groq";

const tierColor = { Reach: "#e74c3c", Match: "#f39c12", Safety: "#27ae60" };
const tierBg   = { Reach: "#fdecea", Match: "#fef9e7", Safety: "#eafaf1" };
const STEPS = ["School Info", "Scores & GPA", "Courses", "Activities", "Essay", "Results"];

const s = {
  page: { minHeight: "100vh", background: "#f4f5fb", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  wrap: { maxWidth: 720, margin: "0 auto", padding: "40px 20px" },
  card: { background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", marginBottom: 24 },
  h2: { marginTop: 0, fontSize: 18, color: "#1a1a2e", fontWeight: 700 },
  label: { fontSize: 13, color: "#555", fontWeight: 600 },
  input: { width: "100%", padding: "10px 14px", fontSize: 15, border: "1px solid #ddd", borderRadius: 8, marginTop: 6, boxSizing: "border-box" },
  tag: (active, color = "#6c63ff") => ({
    padding: "6px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer", border: "none",
    background: active ? color : "#f0f0f0",
    color: active ? "#fff" : "#555", fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
  }),
  row: { display: "flex", gap: 16, marginBottom: 20 },
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
      width: "100%", padding: "11px 0", background: "#f0f0f0",
      color: "#333", border: "none", borderRadius: 10, fontSize: 14,
      fontWeight: 500, cursor: "pointer", marginTop: 8,
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
        return (
          <button key={key} style={s.tag(isActive, color || "#6c63ff")} onClick={() => onToggle(item)}>{key}</button>
        );
      })}
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

export default function App() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    // School
    hsName: "", hsCity: "", hsState: "", hsType: "public",
    // Scores — support SAT, ACT, PSAT all at once
    usedSAT: true, usedACT: false, usedPSAT: false,
    sat: 1200, act: 27, psat: 1100,
    gpa: 3.5, weightedGpa: 3.8,
    major: "Undecided",
    // Courses
    apCourses: [], honorsCourses: [], majorRelatedCourses: [],
    // Languages
    languages: [], languageYears: {},
    // Activities
    leadershipRoles: [],
    ecList: [{ activity: "", years: 1, role: "", relatedToMajor: false }],
    awards: [],
    // Essay
    essay: "",
    ecScore: null, essayScore: null,
    ecFeedback: null, essayFeedback: null,
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

  function getMajorECSuggestions() {
    return MAJOR_EC_SUGGESTIONS[profile.major] || MAJOR_EC_SUGGESTIONS["default"] || [];
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
      update("essayFeedback", { strengths: "", improvements: "", verdict: "Error contacting AI. Check your Groq API key." });
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
        `${i+1}. ${e.activity} | ${e.years} yr(s) | Role: ${e.role} | Related to ${profile.major}: ${e.relatedToMajor ? "Yes" : "No"}`
      ).join("\n");
      const res = await groqChat(
        `You are a college admissions expert. The student is applying for ${profile.major}. Score their extracurricular profile and give:
1. A score out of 10 (weight major-relevant activities higher)
2. What stands out positively (2-3 sentences)
3. What is missing or could be stronger (2-3 sentences)

Format exactly like this:
SCORE: X/10
STRENGTHS: ...
IMPROVEMENTS: ...`,
        ecText
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
    // First filter colleges to 15-20 best matches for this student
    const majorGroup = MAJOR_GROUPS[profile.major] || "undecided";
    const profileWithGroup = { ...profile, majorGroup };
    const selected = selectCollegesForStudent(COLLEGES, profileWithGroup);
    const res = selected.map(c => scoreCollege(c, profileWithGroup)).sort((a, b) => b.pct - a.pct);
    setResults(res);
    setStep(5);
  }

  const ecSuggestions = getMajorECSuggestions();

  // Best test score display
  const bestTestLabel = () => {
    const scores = [];
    if (profile.usedSAT && profile.sat > 0) scores.push(`SAT ${profile.sat}`);
    if (profile.usedACT && profile.act > 0) scores.push(`ACT ${profile.act}`);
    if (profile.usedPSAT && profile.psat > 0) scores.push(`PSAT ${profile.psat}`);
    return scores.join(" · ") || "No test";
  };

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: "#1a1a2e", letterSpacing: -0.5 }}>
            🎓 College Admission Predictor
          </h1>
          <p style={{ color: "#888", marginTop: 8, fontSize: 15 }}>
            Personalized predictions across 90+ US universities — tailored to your major
          </p>
        </div>

        {/* Progress */}
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
            <p style={{ fontSize: 13, color: "#888", marginTop: -8, marginBottom: 20 }}>
              Helps us account for school competitiveness and geographic context.
            </p>

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

            <InfoBox>
              <strong>Why this matters:</strong> A 4.0 from a competitive magnet school in Palo Alto
              or NYC carries different weight than the same GPA elsewhere. We adjust your chances accordingly.
            </InfoBox>

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

            {/* Multi-test toggle */}
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}>Tests Taken (select all that apply)</label>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {[
                  { key: "usedSAT", label: "SAT" },
                  { key: "usedACT", label: "ACT" },
                  { key: "usedPSAT", label: "PSAT" },
                ].map(t => (
                  <button key={t.key} onClick={() => update(t.key, !profile[t.key])} style={{
                    flex: 1, padding: "10px 0", borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: `2px solid ${profile[t.key] ? "#6c63ff" : "#ddd"}`,
                    background: profile[t.key] ? "#6c63ff" : "#fff",
                    color: profile[t.key] ? "#fff" : "#555", cursor: "pointer",
                  }}>{t.label}</button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
                We use your highest equivalent score for predictions.
              </p>
            </div>

            {profile.usedSAT && (
              <SliderRow label="SAT Score" value={profile.sat} min={400} max={1600} step={10} onChange={v => update("sat", v)} />
            )}
            {profile.usedACT && (
              <SliderRow label="ACT Score" value={profile.act} min={1} max={36} step={1} onChange={v => update("act", v)} />
            )}
            {profile.usedPSAT && (
              <div style={{ marginBottom: 20 }}>
                <SliderRow label="PSAT Score" value={profile.psat} min={320} max={1520} step={10} onChange={v => update("psat", v)} />
                <div style={{ background: "#fff8e1", borderRadius: 8, padding: "8px 12px", marginTop: -10 }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#b45309" }}>
                    💡 National Merit Semifinalist cutoff is ~1520 (varies by state). PSAT is converted to SAT equivalent for predictions.
                  </p>
                </div>
              </div>
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
            <TagCloud items={AP_COURSES} selected={profile.apCourses} onToggle={c => toggleString("apCourses", c)} />

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
                  placeholder={`e.g. Intro to ${profile.major}, Research Methods...`}
                  value={c} onChange={e => {
                    const arr = [...profile.majorRelatedCourses];
                    arr[i] = e.target.value;
                    update("majorRelatedCourses", arr);
                  }} />
                <button onClick={() => update("majorRelatedCourses", profile.majorRelatedCourses.filter((_, j) => j !== i))}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <button onClick={() => update("majorRelatedCourses", [...profile.majorRelatedCourses, ""])}
              style={{ fontSize: 13, color: "#6c63ff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
              + Add course
            </button>

            <div style={{ marginTop: 24 }}>
              <SectionLabel count={profile.languages.length}>Foreign Languages</SectionLabel>
              <p style={{ fontSize: 12, color: "#888", marginTop: -8, marginBottom: 10 }}>
                UC schools require 2+ years. Select all languages you study or have studied.
              </p>
              <TagCloud items={LANGUAGES} selected={profile.languages}
                onToggle={l => toggleString("languages", l)} color="#0891b2" />

              {profile.languages.length > 0 && (
                <div style={{ marginTop: 12, background: "#f0f9ff", borderRadius: 10, padding: 14 }}>
                  <p style={{ ...s.label, marginBottom: 12 }}>Years studied per language</p>
                  {profile.languages.map(lang => (
                    <div key={lang} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <span style={{ fontSize: 13, minWidth: 120, color: "#333", fontWeight: 500 }}>{lang}</span>
                      <input type="number" min={1} max={8}
                        value={profile.languageYears[lang] || 1}
                        onChange={e => update("languageYears", { ...profile.languageYears, [lang]: parseInt(e.target.value) })}
                        style={{ ...s.input, width: 70, marginTop: 0 }} />
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
            <h2 style={s.h2}>Leadership, Activities & Awards</h2>

            <SectionLabel count={profile.leadershipRoles.length}>Leadership Roles</SectionLabel>
            <TagCloud items={LEADERSHIP_ROLES} selected={profile.leadershipRoles}
              onToggle={r => toggleObj("leadershipRoles", r)} />

            <div style={{ marginTop: 8 }}>
              <SectionLabel count={profile.awards.length}>Awards & Honors</SectionLabel>
              {["academic", "stem", "arts", "athletics", "community"].map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 0 }}>{cat}</p>
                  <TagCloud items={AWARDS.filter(a => a.category === cat)} selected={profile.awards}
                    onToggle={a => toggleObj("awards", a)} color="#7c3aed" />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <SectionLabel>Extracurricular Activities</SectionLabel>

              <div style={{ background: "#f0eeff", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#5b52cc" }}>
                  💡 Suggested ECs for {profile.major}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ecSuggestions.map(suggestion => (
                    <button key={suggestion} onClick={() => {
                      if (!profile.ecList.find(e => e.activity === suggestion)) {
                        update("ecList", [...profile.ecList, { activity: suggestion, years: 1, role: "Member", relatedToMajor: true }]);
                      }
                    }} style={{
                      padding: "4px 10px", borderRadius: 14, fontSize: 12, cursor: "pointer",
                      border: "1px dashed #a78bfa", background: "#faf5ff", color: "#7c3aed",
                    }}>+ {suggestion}</button>
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
                    <label style={{ fontSize: 12, color: "#888" }}>Activity / Club / Sport</label>
                    <input style={s.input} placeholder="e.g. Varsity Soccer, Robotics Club, Research Lab"
                      value={ec.activity} onChange={e => updateEc(i, "activity", e.target.value)} />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, color: "#888" }}>Years</label>
                      <input type="number" min={1} max={4} style={s.input}
                        value={ec.years} onChange={e => updateEc(i, "years", parseInt(e.target.value))} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: 12, color: "#888" }}>Your Role</label>
                      <input style={s.input} placeholder="e.g. Member, Captain, Founder, Lead"
                        value={ec.role} onChange={e => updateEc(i, "role", e.target.value)} />
                    </div>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, marginTop: 4 }}>
                    <input type="checkbox" checked={ec.relatedToMajor}
                      onChange={e => updateEc(i, "relatedToMajor", e.target.checked)} />
                    <span style={{ color: "#555" }}>Related to {profile.major}</span>
                  </label>
                </div>
              ))}

              <button onClick={() => update("ecList", [...profile.ecList, { activity: "", years: 1, role: "", relatedToMajor: false }])}
                style={{ fontSize: 13, color: "#6c63ff", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>
                + Add another activity
              </button>
            </div>

            {profile.ecFeedback && (
              <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: "#6c63ff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>EC Score</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{profile.ecScore}/10</span>
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
              Paste your Common App personal statement or any college essay below.
            </p>

            <textarea rows={12} placeholder="Paste your essay here (minimum 100 characters)..."
              value={profile.essay} onChange={e => update("essay", e.target.value)}
              style={{ ...s.input, resize: "vertical", lineHeight: 1.6 }} />

            {profile.essayFeedback && (
              <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <div style={{ background: "#6c63ff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Essay Grade</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>{profile.essayScore}/10</span>
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
            {/* Profile summary */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#666", fontWeight: 600 }}>Your Profile Summary</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  ["School", profile.hsName || "—"],
                  ["City", `${profile.hsCity || "—"}, ${profile.hsState || "—"}`],
                  ["Type", profile.hsType],
                  ["Major", profile.major],
                  ["Tests", bestTestLabel()],
                  ["UW GPA", profile.gpa],
                  ["W GPA", profile.weightedGpa],
                  ["APs", profile.apCourses.length],
                  ["Honors", profile.honorsCourses.length],
                  ["Awards", profile.awards.length],
                  ["Languages", profile.languages.length],
                  ["EC Score", `${profile.ecScore || "?"}/10`],
                  ["Essay", `${profile.essayScore || "?"}/10`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f4f5fb", borderRadius: 8, padding: "6px 12px" }}>
                    <span style={{ fontSize: 11, color: "#888" }}>{k} </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier summary */}
            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              {["Safety", "Match", "Reach"].map(tier => (
                <div key={tier} style={{ flex: 1, background: tierBg[tier], borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: tierColor[tier] }}>{results.filter(r => r.tier === tier).length}</div>
                  <div style={{ fontSize: 12, color: tierColor[tier], fontWeight: 600 }}>{tier}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#f0eeff", borderRadius: 10, padding: 12, marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#5b52cc" }}>
                🎯 Showing <strong>{results.length} colleges</strong> selected for your major in <strong>{profile.major}</strong> from our database of 90+ schools.
              </p>
            </div>

            {/* Results by tier */}
            {["Reach", "Match", "Safety"].map(tier => (
              <div key={tier} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tierColor[tier] }} />
                  <h3 style={{ margin: 0, color: tierColor[tier], fontSize: 15, fontWeight: 700 }}>{tier} Schools</h3>
                </div>
                {results.filter(r => r.tier === tier).map(r => (
                  <div key={r.name} style={{
                    background: "#fff", borderRadius: 12, padding: "14px 18px",
                    marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                    borderLeft: `4px solid ${tierColor[tier]}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
                        {r.isPublic && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: "#e0f2fe", color: "#0369a1", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>Public</span>
                        )}
                        {(r.strongGroups || []).includes(profile.majorGroup) && (
                          <span style={{ marginLeft: 6, fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: "2px 7px", borderRadius: 10, fontWeight: 600 }}>
                            Strong for {profile.major}
                          </span>
                        )}
                      </div>
                      <span style={{
                        background: tierBg[tier], color: tierColor[tier],
                        fontWeight: 800, fontSize: 17, padding: "3px 14px", borderRadius: 20,
                      }}>{r.pct}%</span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5 }}>
                      <div style={{ width: `${r.pct}%`, height: 5, borderRadius: 99, background: tierColor[tier] }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 6, display: "flex", gap: 12 }}>
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