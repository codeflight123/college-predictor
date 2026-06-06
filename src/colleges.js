// Minimal clean data module with empty placeholders to avoid syntax errors.
export const COMPETITIVE_CITIES = [];
export const US_STATES = [];
export const MAJORS = [];
export const AP_COURSES = [];
export const HONORS_COURSES = [];
export const LANGUAGES = [];
export const LEADERSHIP_ROLES = [];
export const AWARDS = [];
export const MAJOR_EC_SUGGESTIONS = { default: [] };
export const COLLEGES = [];

export default {};
// Data exports for the app: colleges and selection lists
export const COMPETITIVE_CITIES = [
  "palo alto", "stanford", "menlo park", "mountain view", "cupertino",
  "new york", "nyc", "manhattan", "brooklyn",
  "san francisco", "los angeles", "chicago", "boston", "seattle"
];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID",
  "IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS",
  "MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK",
  "OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export const MAJORS = [
  "Undecided", "Computer Science", "Engineering", "Biology", "Business",
  "Economics", "Psychology", "English", "History", "Art"
];

export const AP_COURSES = [
  "AP Calculus AB", "AP Calculus BC", "AP Physics 1", "AP Physics C", "AP Chemistry",
  "AP Biology", "AP English Language", "AP English Literature", "AP US History", "AP Microeconomics"
];

export const HONORS_COURSES = [
  "Honors Math", "Honors Physics", "Honors Chemistry", "Honors English", "Honors History"
];

export const LANGUAGES = ["Spanish", "French", "Mandarin", "German", "Latin", "Japanese"];

export const LEADERSHIP_ROLES = [
  { label: "President", score: 90 },
  { label: "Vice President", score: 80 },
  { label: "Captain", score: 75 },
  { label: "Founder", score: 85 },
  { label: "Treasurer", score: 65 }
];

export const AWARDS = [
  { label: "National Merit", category: "academic", score: 95 },
  { label: "State Science Fair", category: "stem", score: 80 },
  { label: "Art Competition", category: "arts", score: 70 },
  { label: "All-State Athlete", category: "athletics", score: 75 },
  { label: "Community Service", category: "community", score: 60 }
];

export const MAJOR_EC_SUGGESTIONS = {
  "default": ["Volunteer locally", "Join a club", "Part-time research"],
  "Computer Science": ["Contribute to open-source", "CS research internship", "Hackathons"],
  "Engineering": ["Robotics team", "Engineering internship", "Design competitions"],
  "Biology": ["Lab research", "Science fair project", "Clinical volunteering"],
  "Business": ["Internship at a startup", "DECA/FBLA", "Start a small business"]
};

// Minimal placeholder colleges so the UI and scoring can run. These values are illustrative.
export const COLLEGES = [
  { name: "Sample State University", satMid: 1200, gpaMid: 3.4, ecWeight: 0.6, essayWeight: 0.5, strongMajors: ["Business"], isPublic: true, state: "CA", acceptRate: 0.35 },
  { name: "Tech Institute", satMid: 1450, gpaMid: 3.7, ecWeight: 0.7, essayWeight: 0.6, strongMajors: ["Computer Science","Engineering"], isPublic: false, state: "MA", acceptRate: 0.12 },
  { name: "Liberal Arts College", satMid: 1280, gpaMid: 3.5, ecWeight: 0.65, essayWeight: 0.7, strongMajors: ["English","History"], isPublic: false, state: "NY", acceptRate: 0.28 }
];
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
      update("essayFeedback", { strengths: "", improvements: "", verdict: "Error contacting AI. Check your API key." });
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
    const res = COLLEGES.map(c => scoreCollege(c, profile)).sort((a, b) => b.pct - a.pct);
    setResults(res);
    setStep(5);
  }

  const ecSuggestions = getMajorECSuggestions();

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: "#1a1a2e", letterSpacing: -0.5 }}>
            🎓 US College Predictor
          </h1>
          <p style={{ color: "#888", marginTop: 8, fontSize: 15 }}>
            AI-powered admission predictions for 33 US universities
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 4, borderRadius: 2, marginBottom: 5, background: i <= step ? "#6c63ff" : "#ddd" }} />
              <span style={{ fontSize: 10, color: i <= step ? "#6c63ff" : "#aaa", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── STEP 0: School Info ── */}
        {step === 0 && (
          <div style={s.card}>
            <h2 style={s.h2}>Your High School</h2>
            <p style={{ fontSize: 13, color: "#888", marginTop: -8, marginBottom: 20 }}>
              This helps us account for school competitiveness and geographic context.
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
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                {[
                  { val: "public", label: "🏫 Public" },
                  { val: "private", label: "🏛️ Private" },
                  { val: "charter", label: "📚 Charter" },
                  { val: "magnet", label: "🔬 Magnet / STEM" },
                  { val: "boarding", label: "🎒 Boarding" },
                ].map(t => (
                  <button key={t.val} onClick={() => update("hsType", t.val)} style={{
                    flex: 1, padding: "9px 6px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `2px solid ${profile.hsType === t.val ? "#6c63ff" : "#ddd"}`,
                    background: profile.hsType === t.val ? "#6c63ff" : "#fff",
                    color: profile.hsType === t.val ? "#fff" : "#555", cursor: "pointer"
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div style={{ background: "#f0eeff", borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#5b52cc", lineHeight: 1.6 }}>
                <strong>Why this matters:</strong> Admissions officers consider your school's context.
                A 4.0 from a highly competitive magnet school or a city like Palo Alto or NYC carries
                different weight than the same GPA from a rural public school. We adjust your chances accordingly.
              </p>
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

            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {["SAT", "ACT"].map(t => (
                <button key={t} onClick={() => setTestType(t)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 14, fontWeight: 600,
                  border: `2px solid ${testType === t ? "#6c63ff" : "#ddd"}`,
                  background: testType === t ? "#6c63ff" : "#fff",
                  color: testType === t ? "#fff" : "#555", cursor: "pointer"
                }}>{t}</button>
              ))}
            </div>

            {testType === "SAT"
              ? <SliderRow label="SAT Score" value={profile.sat} min={400} max={1600} step={10} onChange={v => update("sat", v)} />
              : <SliderRow label="ACT Score" value={profile.act} min={1} max={36} step={1} onChange={v => update("act", v)} />
            }

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
            <TagCloud items={AP_COURSES} selected={profile.apCourses}
              onToggle={c => toggleString("apCourses", c)} />

            <SectionLabel count={profile.honorsCourses.length}>Honors Courses</SectionLabel>
            <TagCloud items={HONORS_COURSES} selected={profile.honorsCourses}
              onToggle={c => toggleString("honorsCourses", c)} />

            <SectionLabel count={profile.majorRelatedCourses.length}>
              Courses Related to {profile.major}
            </SectionLabel>
            <p style={{ fontSize: 12, color: "#888", marginTop: -8, marginBottom: 10 }}>
              List any additional courses at your school directly related to your intended major.
            </p>
            {profile.majorRelatedCourses.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input style={{ ...s.input, marginTop: 0 }}
                  placeholder={`e.g. Intro to ${profile.major}, Research Methods...`}
                  value={c} onChange={e => {
                    const arr = [...profile.majorRelatedCourses];
                    arr[i] = e.target.value;
                    update("majorRelatedCourses", arr);
                  }} />
                <button onClick={() => update("majorRelatedCourses", profile.majorRelatedCourses.filter((_, j) => j !== i))}
                  style={{ padding: "0 12px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", cursor: "pointer", marginTop: 0, flexShrink: 0 }}>✕</button>
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
                <div style={{ marginTop: 12 }}>
                  <p style={{ ...s.label, marginBottom: 10 }}>Years studied per language</p>
                  {profile.languages.map(lang => (
                    <div key={lang} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, minWidth: 100, color: "#333" }}>{lang}</span>
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
              onToggle={toggleLeadership} />

            <div style={{ marginTop: 8 }}>
              <SectionLabel count={profile.awards.length}>Awards & Honors</SectionLabel>
              {["academic", "stem", "arts", "athletics", "community"].map(cat => (
                <div key={cat} style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 12, color: "#888", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{cat}</p>
                  <TagCloud
                    items={AWARDS.filter(a => a.category === cat)}
                    selected={profile.awards}
                    onToggle={toggleAward}
                    color="#7c3aed"
                  />
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
                  {ecSuggestions.map(s2 => (
                    <button key={s2} onClick={() => {
                      const exists = profile.ecList.find(e => e.activity === s2);
                      if (!exists) {
                        update("ecList", [...profile.ecList, { activity: s2, years: 1, role: "Member", relatedToMajor: true }]);
                      }
                    }} style={{
                      padding: "4px 10px", borderRadius: 14, fontSize: 12, cursor: "pointer",
                      border: "1px dashed #a78bfa", background: "#faf5ff", color: "#7c3aed"
                    }}>+ {s2}</button>
                  ))}
                </div>
              </div>

              {profile.ecList.map((ec, i) => (
                <div key={i} style={{ background: "#f9f9f9", borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>Activity {i + 1}</span>
                    {profile.ecList.length > 1 && (
                      <button onClick={() => update("ecList", profile.ecList.filter((_, j) => j !== i))}
                        style={{ background: "#fee2e2", border: "none", borderRadius: 6, padding: "3px 8px", color: "#dc2626", cursor: "pointer", fontSize: 12 }}>Remove</button>
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
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={ec.relatedToMajor}
                      onChange={e => updateEc(i, "relatedToMajor", e.target.checked)} />
                    <span style={{ color: "#555" }}>Related to my intended major ({profile.major})</span>
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
                <div style={{ background: "#6c63ff", padding: "12px 16px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#fff", fontWeight: 700 }}>EC Score</span>
                  <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>{profile.ecScore}/10</span>
                </div>
                <div style={{ background: "#f9f9f9", padding: 16 }}>
                  {profile.ecFeedback.strengths && <p style={{ margin: "0 0 10px", fontSize: 13, color: "#333" }}><strong style={{ color: "#27ae60" }}>✅ Strengths:</strong> {profile.ecFeedback.strengths}</p>}
                  {profile.ecFeedback.improvements && <p style={{ margin: 0, fontSize: 13, color: "#333" }}><strong style={{ color: "#e67e22" }}>⚠️ Improvements:</strong> {profile.ecFeedback.improvements}</p>}
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
                  ["City", `${profile.hsCity || "—"}, ${profile.hsState || "—"}`],
                  ["Type", profile.hsType],
                  ["Major", profile.major],
                  [testType, testType === "SAT" ? profile.sat : profile.act],
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

            <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
              {["Safety", "Match", "Reach"].map(tier => (
                <div key={tier} style={{ flex: 1, background: tierBg[tier], borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: tierColor[tier] }}>{results.filter(r => r.tier === tier).length}</div>
                  <div style={{ fontSize: 12, color: tierColor[tier], fontWeight: 600 }}>{tier}</div>
                </div>
              ))}
            </div>

            {["Reach", "Match", "Safety"].map(tier => (
              <div key={tier} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tierColor[tier] }} />
                  <h3 style={{ margin: 0, color: tierColor[tier], fontSize: 15, fontWeight: 700 }}>{tier} Schools</h3>
                </div>
                {results.filter(r => r.tier === tier).map(r => (
                  <div key={r.name} style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", marginBottom: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.06)", borderLeft: `4px solid ${tierColor[tier]}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
                        {r.strongMajors?.includes(profile.major) && (
                          <span style={{ marginLeft: 8, fontSize: 11, background: "#e8f5e9", color: "#2e7d32", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                            Strong for {profile.major}
                          </span>
                        )}
                      </div>
                      <span style={{ background: tierBg[tier], color: tierColor[tier], fontWeight: 800, fontSize: 17, padding: "3px 14px", borderRadius: 20 }}>{r.pct}%</span>
                    </div>
                    <div style={{ background: "#f0f0f0", borderRadius: 99, height: 5 }}>
                      <div style={{ width: `${r.pct}%`, height: 5, borderRadius: 99, background: tierColor[tier] }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
                      Avg SAT: {r.satMid} · Accept rate: {Math.round(r.acceptRate * 100)}%
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
