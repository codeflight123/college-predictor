export const COLLEGES = [
  { name: "MIT", satMid: 1580, actMid: 36, gpaMid: 4.17, acceptRate: 0.04, ecWeight: 0.95, essayWeight: 0.90, strongMajors: ["Computer Science", "Engineering", "Physics", "Mathematics"], state: "MA", isPublic: false },
  { name: "Harvard", satMid: 1580, actMid: 36, gpaMid: 4.18, acceptRate: 0.03, ecWeight: 0.98, essayWeight: 0.97, strongMajors: ["Economics", "Political Science", "Biology", "History"], state: "MA", isPublic: false },
  { name: "Stanford", satMid: 1570, actMid: 35, gpaMid: 4.18, acceptRate: 0.04, ecWeight: 0.97, essayWeight: 0.95, strongMajors: ["Computer Science", "Engineering", "Business", "Psychology"], state: "CA", isPublic: false },
  { name: "Princeton", satMid: 1570, actMid: 35, gpaMid: 3.90, acceptRate: 0.04, ecWeight: 0.96, essayWeight: 0.95, strongMajors: ["Mathematics", "Physics", "Economics", "Philosophy"], state: "NJ", isPublic: false },
  { name: "Yale", satMid: 1560, actMid: 35, gpaMid: 4.10, acceptRate: 0.05, ecWeight: 0.96, essayWeight: 0.97, strongMajors: ["Political Science", "History", "Drama", "Law"], state: "CT", isPublic: false },
  { name: "Columbia", satMid: 1560, actMid: 35, gpaMid: 4.12, acceptRate: 0.04, ecWeight: 0.94, essayWeight: 0.94, strongMajors: ["Journalism", "Political Science", "Economics", "Engineering"], state: "NY", isPublic: false },
  { name: "UPenn", satMid: 1530, actMid: 35, gpaMid: 3.90, acceptRate: 0.07, ecWeight: 0.93, essayWeight: 0.92, strongMajors: ["Business", "Economics", "Nursing", "Biology"], state: "PA", isPublic: false },
  { name: "Brown", satMid: 1530, actMid: 35, gpaMid: 4.05, acceptRate: 0.05, ecWeight: 0.93, essayWeight: 0.94, strongMajors: ["Computer Science", "Biology", "Psychology", "English"], state: "RI", isPublic: false },
  { name: "Dartmouth", satMid: 1530, actMid: 34, gpaMid: 3.99, acceptRate: 0.06, ecWeight: 0.92, essayWeight: 0.93, strongMajors: ["Economics", "Government", "Engineering", "History"], state: "NH", isPublic: false },
  { name: "Cornell", satMid: 1510, actMid: 34, gpaMid: 4.05, acceptRate: 0.07, ecWeight: 0.90, essayWeight: 0.88, strongMajors: ["Engineering", "Architecture", "Hotel Administration", "Biology"], state: "NY", isPublic: false },
  { name: "Duke", satMid: 1540, actMid: 35, gpaMid: 4.13, acceptRate: 0.06, ecWeight: 0.92, essayWeight: 0.91, strongMajors: ["Biology", "Economics", "Public Policy", "Engineering"], state: "NC", isPublic: false },
  { name: "Northwestern", satMid: 1530, actMid: 34, gpaMid: 4.10, acceptRate: 0.07, ecWeight: 0.91, essayWeight: 0.91, strongMajors: ["Journalism", "Theater", "Economics", "Engineering"], state: "IL", isPublic: false },
  { name: "Johns Hopkins", satMid: 1540, actMid: 35, gpaMid: 3.92, acceptRate: 0.07, ecWeight: 0.90, essayWeight: 0.89, strongMajors: ["Biology", "Neuroscience", "Public Health", "Engineering"], state: "MD", isPublic: false },
  { name: "Vanderbilt", satMid: 1530, actMid: 34, gpaMid: 3.83, acceptRate: 0.07, ecWeight: 0.89, essayWeight: 0.89, strongMajors: ["Medicine", "Education", "Economics", "Engineering"], state: "TN", isPublic: false },
  { name: "Rice", satMid: 1540, actMid: 35, gpaMid: 4.12, acceptRate: 0.08, ecWeight: 0.91, essayWeight: 0.90, strongMajors: ["Engineering", "Music", "Architecture", "Physics"], state: "TX", isPublic: false },
  { name: "WashU St. Louis", satMid: 1530, actMid: 34, gpaMid: 4.05, acceptRate: 0.12, ecWeight: 0.88, essayWeight: 0.88, strongMajors: ["Business", "Engineering", "Medicine", "Social Work"], state: "MO", isPublic: false },
  { name: "Notre Dame", satMid: 1510, actMid: 34, gpaMid: 4.06, acceptRate: 0.12, ecWeight: 0.88, essayWeight: 0.87, strongMajors: ["Business", "Engineering", "Political Science", "Theology"], state: "IN", isPublic: false },
  { name: "Georgetown", satMid: 1480, actMid: 33, gpaMid: 3.90, acceptRate: 0.12, ecWeight: 0.87, essayWeight: 0.89, strongMajors: ["International Relations", "Political Science", "Business", "Nursing"], state: "DC", isPublic: false },
  { name: "Carnegie Mellon", satMid: 1540, actMid: 35, gpaMid: 3.84, acceptRate: 0.11, ecWeight: 0.88, essayWeight: 0.85, strongMajors: ["Computer Science", "Engineering", "Drama", "Design"], state: "PA", isPublic: false },
  { name: "UC Berkeley", satMid: 1430, actMid: 33, gpaMid: 4.15, acceptRate: 0.14, ecWeight: 0.82, essayWeight: 0.80, strongMajors: ["Computer Science", "Engineering", "Economics", "Political Science"], state: "CA", isPublic: true },
  { name: "UCLA", satMid: 1420, actMid: 32, gpaMid: 4.15, acceptRate: 0.09, ecWeight: 0.82, essayWeight: 0.80, strongMajors: ["Film", "Psychology", "Biology", "Economics"], state: "CA", isPublic: true },
  { name: "USC", satMid: 1460, actMid: 33, gpaMid: 3.79, acceptRate: 0.13, ecWeight: 0.85, essayWeight: 0.84, strongMajors: ["Film", "Business", "Engineering", "Communications"], state: "CA", isPublic: false },
  { name: "UMich Ann Arbor", satMid: 1430, actMid: 33, gpaMid: 3.88, acceptRate: 0.18, ecWeight: 0.83, essayWeight: 0.80, strongMajors: ["Engineering", "Business", "Political Science", "Psychology"], state: "MI", isPublic: true },
  { name: "Georgia Tech", satMid: 1470, actMid: 33, gpaMid: 4.07, acceptRate: 0.17, ecWeight: 0.80, essayWeight: 0.75, strongMajors: ["Engineering", "Computer Science", "Architecture", "Business"], state: "GA", isPublic: true },
  { name: "UNC Chapel Hill", satMid: 1380, actMid: 31, gpaMid: 4.35, acceptRate: 0.19, ecWeight: 0.80, essayWeight: 0.79, strongMajors: ["Journalism", "Public Health", "Business", "Psychology"], state: "NC", isPublic: true },
  { name: "UT Austin", satMid: 1350, actMid: 31, gpaMid: 3.82, acceptRate: 0.29, ecWeight: 0.75, essayWeight: 0.74, strongMajors: ["Business", "Engineering", "Communications", "Computer Science"], state: "TX", isPublic: true },
  { name: "UC San Diego", satMid: 1400, actMid: 32, gpaMid: 4.12, acceptRate: 0.24, ecWeight: 0.75, essayWeight: 0.72, strongMajors: ["Biology", "Computer Science", "Engineering", "Economics"], state: "CA", isPublic: true },
  { name: "UC Davis", satMid: 1310, actMid: 29, gpaMid: 4.03, acceptRate: 0.39, ecWeight: 0.70, essayWeight: 0.68, strongMajors: ["Agriculture", "Biology", "Veterinary", "Environmental Science"], state: "CA", isPublic: true },
  { name: "Purdue", satMid: 1330, actMid: 30, gpaMid: 3.70, acceptRate: 0.53, ecWeight: 0.68, essayWeight: 0.65, strongMajors: ["Engineering", "Agriculture", "Computer Science", "Aviation"], state: "IN", isPublic: true },
  { name: "Penn State", satMid: 1250, actMid: 28, gpaMid: 3.58, acceptRate: 0.54, ecWeight: 0.65, essayWeight: 0.62, strongMajors: ["Engineering", "Business", "Education", "Communications"], state: "PA", isPublic: true },
  { name: "Ohio State", satMid: 1310, actMid: 29, gpaMid: 3.80, acceptRate: 0.54, ecWeight: 0.67, essayWeight: 0.64, strongMajors: ["Business", "Engineering", "Education", "Agriculture"], state: "OH", isPublic: true },
  { name: "Indiana University", satMid: 1210, actMid: 27, gpaMid: 3.65, acceptRate: 0.80, ecWeight: 0.60, essayWeight: 0.58, strongMajors: ["Business", "Music", "Informatics", "Education"], state: "IN", isPublic: true },
  { name: "Arizona State", satMid: 1180, actMid: 25, gpaMid: 3.50, acceptRate: 0.88, ecWeight: 0.55, essayWeight: 0.52, strongMajors: ["Business", "Engineering", "Journalism", "Education"], state: "AZ", isPublic: true },
];

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL",
  "GA","HI","ID","IL","IN","IA","KS","KY","LA","ME",
  "MD","MA","MI","MN","MS","MO","MT","NE","NV","NH",
  "NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI",
  "SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export const COMPETITIVE_CITIES = [
  "new york", "nyc", "brooklyn", "manhattan",
  "los angeles", "la", "san francisco", "sf", "palo alto", "cupertino", "san jose",
  "boston", "cambridge", "brookline", "lexington", "newton",
  "chicago", "evanston", "naperville",
  "washington dc", "washington", "dc", "bethesda", "mclean", "potomac",
  "seattle", "bellevue", "redmond",
  "houston", "dallas", "austin",
  "miami", "coral gables",
  "atlanta", "johns creek",
  "princeton", "greenwich", "fairfield", "westport",
  "scarsdale", "great neck", "syosset", "jericho",
  "irvine", "fremont", "pleasanton",
  "ann arbor", "troy", "birmingham",
  "minneapolis", "eden prairie",
];

export const MAJORS = [
  "Computer Science", "Engineering", "Mathematics", "Physics",
  "Biology", "Chemistry", "Neuroscience", "Environmental Science",
  "Biomedical Engineering", "Mechanical Engineering", "Electrical Engineering",
  "Civil Engineering", "Chemical Engineering", "Aerospace Engineering",
  "Economics", "Business", "Finance", "Accounting",
  "Political Science", "International Relations", "History", "Philosophy",
  "Psychology", "Sociology", "Anthropology", "Education",
  "English", "Journalism", "Communications", "Linguistics",
  "Pre-Med", "Nursing", "Public Health", "Pharmacy",
  "Architecture", "Design", "Film", "Music", "Drama",
  "Agriculture", "Veterinary", "Undecided",
];

export const AP_COURSES = [
  "AP Calculus AB", "AP Calculus BC", "AP Statistics",
  "AP Physics 1", "AP Physics 2", "AP Physics C: Mechanics", "AP Physics C: E&M",
  "AP Chemistry", "AP Biology", "AP Environmental Science",
  "AP Computer Science A", "AP Computer Science Principles",
  "AP US History", "AP World History", "AP European History",
  "AP Government", "AP Economics (Macro)", "AP Economics (Micro)",
  "AP English Language", "AP English Literature",
  "AP Spanish Language", "AP Spanish Literature",
  "AP French Language", "AP Mandarin", "AP Latin", "AP Japanese",
  "AP Psychology", "AP Art History", "AP Music Theory",
  "AP Studio Art", "AP Human Geography", "AP Seminar", "AP Research",
];

export const HONORS_COURSES = [
  "Honors English", "Honors Math", "Honors Biology",
  "Honors Chemistry", "Honors Physics", "Honors History",
  "Honors Spanish", "Honors French", "Honors Economics",
  "Honors Computer Science",
  "Honors Intro to Engineering",
  "Honors Principles of Engineering",
  "Honors Medical Intervention",
  "Honors Principles of Biomedical Science",
  "Honors Human Body Systems",
  "Dual Enrollment (College Course)",
];

export const LEADERSHIP_ROLES = [
  { label: "President", score: 90 },
  { label: "Vice President", score: 80 },
  { label: "Captain", score: 75 },
  { label: "Founder", score: 85 },
  { label: "Treasurer", score: 65 },
  { label: "Secretary", score: 60 },
  { label: "Committee Chair", score: 70 }
];

export const LANGUAGES = [
  "Spanish", "French", "Mandarin", "Japanese", "German",
  "Arabic", "Portuguese", "Korean", "Italian", "Latin",
  "Hindi", "Russian", "Farsi", "Vietnamese", "Tagalog",
  "ASL (American Sign Language)",
];

export const AWARDS = [
  // Academic
  { label: "National Merit Finalist", score: 10, category: "academic" },
  { label: "National Merit Semifinalist", score: 9, category: "academic" },
  { label: "National Merit Commended", score: 7, category: "academic" },
  { label: "AP Scholar with Distinction", score: 7, category: "academic" },
  { label: "AP Scholar with Honor", score: 6, category: "academic" },
  { label: "AP Scholar", score: 5, category: "academic" },
  { label: "Valedictorian", score: 10, category: "academic" },
  { label: "Salutatorian", score: 9, category: "academic" },
  { label: "National Honor Society", score: 5, category: "academic" },
  // STEM
  { label: "USAMO / USAJMO Qualifier", score: 10, category: "stem" },
  { label: "AMC 10/12 Top Score", score: 8, category: "stem" },
  { label: "Science Olympiad State/National Medal", score: 9, category: "stem" },
  { label: "ISEF Finalist", score: 10, category: "stem" },
  { label: "Regeneron STS Scholar", score: 10, category: "stem" },
  { label: "First Robotics Dean's List", score: 9, category: "stem" },
  { label: "Congressional App Challenge Winner", score: 9, category: "stem" },
  { label: "Google Science Fair", score: 10, category: "stem" },
  // Arts / Humanities
  { label: "National Scholastic Art Gold Key", score: 8, category: "arts" },
  { label: "National Scholastic Writing Gold Key", score: 8, category: "arts" },
  { label: "YoungArts Winner", score: 9, category: "arts" },
  { label: "National Speech & Debate Award", score: 8, category: "arts" },
  // Athletics
  { label: "All-State Athlete", score: 9, category: "athletics" },
  { label: "All-Region Athlete", score: 7, category: "athletics" },
  { label: "Team State Championship", score: 8, category: "athletics" },
  // Community
  { label: "Presidential Volunteer Service Award (Gold)", score: 7, category: "community" },
  { label: "Eagle Scout / Gold Award", score: 9, category: "community" },
  { label: "State/Regional Leadership Award", score: 7, category: "community" },
];

// Major-relevant EC suggestions shown to user
export const MAJOR_EC_SUGGESTIONS = {
  "Computer Science": ["Competitive Programming Club", "Hackathon Participant/Winner", "Personal Projects (Apps/Websites)", "Robotics Club", "AI/ML Research", "Open Source Contributor"],
  "Engineering": ["Robotics Club", "Science Olympiad", "Engineering Club", "FIRST Robotics", "Bridge Building Competition", "CAD/Design Projects"],
  "Biomedical Engineering": ["Hospital Volunteering", "Research Lab Assistant", "Health Informatics Club", "Science Fair (Biology/Engineering)", "Red Cross Club", "HOSA"],
  "Mechanical Engineering": ["Robotics Club", "FIRST Robotics", "Auto Shop/Racing Club", "3D Printing Club", "Physics Olympiad", "Engineering Competitions"],
  "Biology": ["Research Lab Assistant", "Science Fair", "Hospital Volunteering", "Environmental Club", "Science Olympiad (Bio)", "HOSA"],
  "Pre-Med": ["Hospital/Clinic Volunteering", "HOSA", "Research Lab Assistant", "Red Cross Club", "EMT Certification", "Health Awareness Campaigns"],
  "Nursing": ["Hospital Volunteering", "CNA Certification", "HOSA", "Red Cross Club", "Community Health Events"],
  "Business": ["DECA", "FBLA", "Entrepreneurship Club", "Stock Market Club", "Small Business Owner", "Model UN"],
  "Economics": ["DECA", "Stock Market Club", "Economics Olympiad", "Model UN", "Financial Literacy Tutoring"],
  "Political Science": ["Model UN", "Student Government", "Debate Team", "Internship (Government)", "Political Campaign Volunteer"],
  "Film": ["Film Club", "Short Film Director", "Yearbook/Media Team", "YouTube Channel", "School News Anchor"],
  "Music": ["Orchestra/Band", "Jazz Band", "Choir", "Music Composition", "Private Music Teaching"],
  "Mathematics": ["Math Olympiad", "AMC/AIME Prep Club", "Math Tutoring", "Statistics Research", "Coding Club"],
  "Psychology": ["Peer Counseling", "Mental Health Awareness Club", "Research Lab Assistant", "Hospital Volunteering", "HOSA"],
  "default": ["Student Government", "Debate Team", "Volunteering", "Sports (Varsity)", "Club Leadership", "Research"],
};
