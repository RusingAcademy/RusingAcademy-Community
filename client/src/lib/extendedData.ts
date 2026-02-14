// ============================================================
// EXTENDED DATA: Gamification, Courses, Events, Challenges, Notebook
// Integrates best features from Skool, Kajabi, and Italki
// ============================================================

// ---- GAMIFICATION (Skool-inspired) ----

export interface MemberLevel {
  level: number;
  name: string;
  minPoints: number;
  color: string;
  icon: string; // emoji
  unlocksContent?: string;
}

export interface LeaderboardMember {
  id: string;
  name: string;
  avatar: string;
  points: number;
  level: number;
  levelName: string;
  streak: number;
  postsCount: number;
  commentsCount: number;
  badgeCount: number;
}

export const memberLevels: MemberLevel[] = [
  { level: 1, name: "Newcomer", minPoints: 0, color: "#94a3b8", icon: "🌱" },
  { level: 2, name: "Explorer", minPoints: 100, color: "#2EC4B6", icon: "🧭" },
  { level: 3, name: "Contributor", minPoints: 500, color: "#3b82f6", icon: "✍️", unlocksContent: "Advanced Grammar Course" },
  { level: 4, name: "Scholar", minPoints: 1500, color: "#8b5cf6", icon: "📚", unlocksContent: "IELTS Masterclass" },
  { level: 5, name: "Master", minPoints: 5000, color: "#FF4B2B", icon: "🏆", unlocksContent: "All Premium Content" },
];

export const leaderboard: LeaderboardMember[] = [
  { id: "l1", name: "Maria Gonzalez", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face", points: 7820, level: 5, levelName: "Master", streak: 45, postsCount: 124, commentsCount: 389, badgeCount: 12 },
  { id: "l2", name: "Kenji Tanaka", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face", points: 6540, level: 5, levelName: "Master", streak: 38, postsCount: 98, commentsCount: 312, badgeCount: 10 },
  { id: "l3", name: "Sophie Laurent", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face", points: 4200, level: 4, levelName: "Scholar", streak: 22, postsCount: 67, commentsCount: 201, badgeCount: 8 },
  { id: "l4", name: "Ahmed Hassan", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face", points: 3100, level: 4, levelName: "Scholar", streak: 19, postsCount: 45, commentsCount: 178, badgeCount: 6 },
  { id: "l5", name: "Elena Popova", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face", points: 2400, level: 4, levelName: "Scholar", streak: 15, postsCount: 34, commentsCount: 145, badgeCount: 5 },
  { id: "l6", name: "Lucas Müller", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face", points: 1800, level: 4, levelName: "Scholar", streak: 12, postsCount: 28, commentsCount: 112, badgeCount: 4 },
  { id: "l7", name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face", points: 980, level: 3, levelName: "Contributor", streak: 8, postsCount: 19, commentsCount: 76, badgeCount: 3 },
  { id: "l8", name: "David Kim", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face", points: 620, level: 3, levelName: "Contributor", streak: 5, postsCount: 12, commentsCount: 54, badgeCount: 2 },
  { id: "l9", name: "Fatima Al-Rashid", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face", points: 340, level: 2, levelName: "Explorer", streak: 3, postsCount: 7, commentsCount: 28, badgeCount: 1 },
  { id: "l10", name: "Carlos Rivera", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face", points: 150, level: 2, levelName: "Explorer", streak: 2, postsCount: 4, commentsCount: 15, badgeCount: 1 },
];

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const badges: Badge[] = [
  { id: "b1", name: "First Post", icon: "📝", description: "Published your first community post", color: "#2EC4B6" },
  { id: "b2", name: "Helpful", icon: "🤝", description: "Received 10 likes on your answers", color: "#3b82f6" },
  { id: "b3", name: "Streak Master", icon: "🔥", description: "Maintained a 7-day activity streak", color: "#FF4B2B" },
  { id: "b4", name: "Polyglot", icon: "🌍", description: "Active in 3+ language communities", color: "#8b5cf6" },
  { id: "b5", name: "Mentor", icon: "🎓", description: "Helped 50 students with corrections", color: "#f59e0b" },
  { id: "b6", name: "Quiz Champion", icon: "🏅", description: "Completed 20 exercises with perfect score", color: "#10b981" },
  { id: "b7", name: "Podcaster", icon: "🎙️", description: "Listened to 50 community podcasts", color: "#ec4899" },
  { id: "b8", name: "Challenge Finisher", icon: "⚡", description: "Completed a 30-day challenge", color: "#f97316" },
];

// ---- COURSES / CLASSROOM (Skool + Kajabi inspired) ----

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "text" | "quiz";
  completed: boolean;
  locked: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: CourseLesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  instructor: { name: string; avatar: string };
  level: string;
  duration: string;
  lessonsCount: number;
  enrolledCount: number;
  rating: number;
  progress: number;
  tags: string[];
  requiredLevel?: number;
  modules: CourseModule[];
}

export const courses: Course[] = [
  {
    id: "c1",
    title: "French for Beginners: From Zero to Conversational",
    description: "Master the fundamentals of French with structured lessons covering pronunciation, grammar, vocabulary, and everyday conversations. Perfect for absolute beginners.",
    image: "COURSE_FRENCH",
    instructor: { name: "Sophie Laurent", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
    level: "Beginner",
    duration: "8 weeks",
    lessonsCount: 24,
    enrolledCount: 1247,
    rating: 4.8,
    progress: 0,
    tags: ["French", "Beginner", "Conversation"],
    modules: [
      {
        id: "m1", title: "Getting Started with French", lessons: [
          { id: "l1", title: "The French Alphabet & Pronunciation", duration: "12 min", type: "video", completed: false, locked: false },
          { id: "l2", title: "Essential Greetings & Introductions", duration: "15 min", type: "video", completed: false, locked: false },
          { id: "l3", title: "Numbers 1-100", duration: "10 min", type: "video", completed: false, locked: false },
          { id: "l4", title: "Module 1 Quiz", duration: "5 min", type: "quiz", completed: false, locked: false },
        ]
      },
      {
        id: "m2", title: "Everyday Conversations", lessons: [
          { id: "l5", title: "At the Café — Ordering Food & Drinks", duration: "18 min", type: "video", completed: false, locked: true },
          { id: "l6", title: "Asking for Directions", duration: "14 min", type: "video", completed: false, locked: true },
          { id: "l7", title: "Shopping & Bargaining", duration: "16 min", type: "video", completed: false, locked: true },
          { id: "l8", title: "Module 2 Quiz", duration: "5 min", type: "quiz", completed: false, locked: true },
        ]
      },
    ],
  },
  {
    id: "c2",
    title: "Business English: Professional Communication",
    description: "Elevate your professional English skills with focused modules on email writing, presentations, negotiations, and corporate vocabulary.",
    image: "COURSE_BUSINESS",
    instructor: { name: "Samuel Fuentes", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
    level: "Intermediate",
    duration: "6 weeks",
    lessonsCount: 18,
    enrolledCount: 892,
    rating: 4.9,
    progress: 45,
    tags: ["English", "Business", "Professional"],
    modules: [
      {
        id: "m3", title: "Professional Email Writing", lessons: [
          { id: "l9", title: "Email Structure & Tone", duration: "14 min", type: "video", completed: true, locked: false },
          { id: "l10", title: "Common Email Templates", duration: "12 min", type: "video", completed: true, locked: false },
          { id: "l11", title: "Writing Practice", duration: "20 min", type: "text", completed: false, locked: false },
        ]
      },
      {
        id: "m4", title: "Presentation Skills", lessons: [
          { id: "l12", title: "Opening & Closing a Presentation", duration: "16 min", type: "video", completed: false, locked: false },
          { id: "l13", title: "Handling Q&A Sessions", duration: "14 min", type: "video", completed: false, locked: true },
          { id: "l14", title: "Module Quiz", duration: "5 min", type: "quiz", completed: false, locked: true },
        ]
      },
    ],
  },
  {
    id: "c3",
    title: "IELTS Preparation: Band 7+ Strategy",
    description: "Comprehensive IELTS preparation covering all four sections — Listening, Reading, Writing, and Speaking — with proven strategies for achieving Band 7 and above.",
    image: "COURSE_IELTS",
    instructor: { name: "Nick IELTS Examiner", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face" },
    level: "Advanced",
    duration: "10 weeks",
    lessonsCount: 30,
    enrolledCount: 2156,
    rating: 4.7,
    progress: 0,
    tags: ["English", "IELTS", "Exam Prep"],
    requiredLevel: 3,
    modules: [
      {
        id: "m5", title: "Listening Strategies", lessons: [
          { id: "l15", title: "Understanding Question Types", duration: "20 min", type: "video", completed: false, locked: false },
          { id: "l16", title: "Note-Taking Techniques", duration: "15 min", type: "video", completed: false, locked: false },
          { id: "l17", title: "Practice Test 1", duration: "30 min", type: "quiz", completed: false, locked: false },
        ]
      },
      {
        id: "m6", title: "Writing Task 2 Mastery", lessons: [
          { id: "l18", title: "Essay Structure & Planning", duration: "22 min", type: "video", completed: false, locked: true },
          { id: "l19", title: "Advanced Vocabulary for Essays", duration: "18 min", type: "text", completed: false, locked: true },
          { id: "l20", title: "Practice Essay & Feedback", duration: "45 min", type: "text", completed: false, locked: true },
        ]
      },
    ],
  },
];

// ---- EVENTS / CALENDAR (Skool + Kajabi inspired) ----

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  time: string;
  timezone: string;
  type: "webinar" | "workshop" | "meetup" | "livestream" | "qa-session";
  host: { name: string; avatar: string };
  attendees: number;
  maxAttendees: number;
  isRegistered: boolean;
  tags: string[];
  recurring?: string;
}

export const events: CommunityEvent[] = [
  {
    id: "ev1",
    title: "Weekly French Conversation Circle",
    description: "Join our friendly French conversation practice session. All levels welcome! We'll discuss current events, culture, and everyday topics in French with guidance from native speakers.",
    image: "EVENT_WEBINAR",
    date: "Feb 15, 2026",
    time: "2:00 PM",
    timezone: "EST",
    type: "meetup",
    host: { name: "Sophie Laurent", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
    attendees: 34,
    maxAttendees: 50,
    isRegistered: false,
    tags: ["French", "Conversation", "All Levels"],
    recurring: "Every Saturday",
  },
  {
    id: "ev2",
    title: "IELTS Writing Task 2: Live Workshop",
    description: "An intensive 90-minute workshop focused on IELTS Writing Task 2. Learn essay structures, practice with real exam questions, and get instant feedback from an experienced examiner.",
    image: "COURSE_IELTS",
    date: "Feb 18, 2026",
    time: "10:00 AM",
    timezone: "EST",
    type: "workshop",
    host: { name: "Nick IELTS Examiner", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face" },
    attendees: 87,
    maxAttendees: 200,
    isRegistered: true,
    tags: ["IELTS", "Writing", "Exam Prep"],
  },
  {
    id: "ev3",
    title: "Business English: Mastering Negotiations",
    description: "Learn the art of negotiation in English with role-playing exercises, key phrases, and cultural insights for international business contexts.",
    image: "COURSE_BUSINESS",
    date: "Feb 20, 2026",
    time: "3:00 PM",
    timezone: "EST",
    type: "webinar",
    host: { name: "Samuel Fuentes", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
    attendees: 56,
    maxAttendees: 100,
    isRegistered: false,
    tags: ["Business English", "Negotiations", "Professional"],
  },
  {
    id: "ev4",
    title: "Ask Me Anything: Language Learning Tips",
    description: "Open Q&A session with our top-rated polyglot instructors. Bring your questions about language learning strategies, motivation, and overcoming plateaus.",
    image: "EVENT_WEBINAR",
    date: "Feb 22, 2026",
    time: "1:00 PM",
    timezone: "EST",
    type: "qa-session",
    host: { name: "Maria Gonzalez", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" },
    attendees: 123,
    maxAttendees: 500,
    isRegistered: false,
    tags: ["Q&A", "Tips", "All Languages"],
  },
  {
    id: "ev5",
    title: "Pronunciation Clinic: English Sounds",
    description: "A focused session on the most challenging English sounds for non-native speakers. Practice minimal pairs, intonation patterns, and connected speech.",
    image: "COURSE_BUSINESS",
    date: "Feb 25, 2026",
    time: "11:00 AM",
    timezone: "EST",
    type: "livestream",
    host: { name: "Lindsay", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
    attendees: 42,
    maxAttendees: 150,
    isRegistered: false,
    tags: ["Pronunciation", "English", "Speaking"],
  },
];

// ---- CHALLENGES (Kajabi-inspired) ----

export interface ChallengeDay {
  day: number;
  title: string;
  description: string;
  completed: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  image: string;
  duration: string;
  daysTotal: number;
  daysCompleted: number;
  participants: number;
  prize?: string;
  startDate: string;
  endDate: string;
  host: { name: string; avatar: string };
  tags: string[];
  status: "upcoming" | "active" | "completed";
  days: ChallengeDay[];
}

export const challenges: Challenge[] = [
  {
    id: "ch1",
    title: "30-Day Vocabulary Builder",
    description: "Learn 10 new words every day for 30 days. By the end, you'll have mastered 300 essential words with spaced repetition and daily quizzes to lock them into long-term memory.",
    image: "CHALLENGE_30DAY",
    duration: "30 days",
    daysTotal: 30,
    daysCompleted: 12,
    participants: 456,
    prize: "Premium Course Access + Certificate",
    startDate: "Feb 1, 2026",
    endDate: "Mar 2, 2026",
    host: { name: "Maria Gonzalez", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" },
    tags: ["Vocabulary", "Daily Practice", "All Languages"],
    status: "active",
    days: [
      { day: 1, title: "Greetings & Introductions", description: "Learn 10 essential greeting words", completed: true },
      { day: 2, title: "Family & Relationships", description: "Master family-related vocabulary", completed: true },
      { day: 3, title: "Food & Dining", description: "Restaurant and cooking vocabulary", completed: true },
      { day: 4, title: "Travel & Transportation", description: "Getting around in a new city", completed: true },
      { day: 5, title: "Work & Office", description: "Professional workplace vocabulary", completed: true },
      { day: 6, title: "Health & Body", description: "Medical and wellness terms", completed: true },
      { day: 7, title: "Week 1 Review Quiz", description: "Test your knowledge from days 1-6", completed: true },
      { day: 8, title: "Shopping & Money", description: "Commerce and financial terms", completed: true },
      { day: 9, title: "Weather & Seasons", description: "Describing weather and climate", completed: true },
      { day: 10, title: "Emotions & Feelings", description: "Expressing how you feel", completed: true },
      { day: 11, title: "Home & Furniture", description: "Describing your living space", completed: true },
      { day: 12, title: "Education & Learning", description: "Academic and study vocabulary", completed: true },
      { day: 13, title: "Sports & Hobbies", description: "Leisure activity vocabulary", completed: false },
      { day: 14, title: "Week 2 Review Quiz", description: "Test your knowledge from days 8-13", completed: false },
      { day: 15, title: "Technology & Internet", description: "Digital world vocabulary", completed: false },
    ],
  },
  {
    id: "ch2",
    title: "7-Day Speaking Confidence Boost",
    description: "Overcome your fear of speaking! Each day includes a speaking prompt, a recording exercise, and community feedback. Build confidence one day at a time.",
    image: "EVENT_WEBINAR",
    duration: "7 days",
    daysTotal: 7,
    daysCompleted: 0,
    participants: 234,
    startDate: "Feb 17, 2026",
    endDate: "Feb 23, 2026",
    host: { name: "Kenji Tanaka", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
    tags: ["Speaking", "Confidence", "Beginner Friendly"],
    status: "upcoming",
    days: [
      { day: 1, title: "Introduce Yourself", description: "Record a 1-minute self-introduction", completed: false },
      { day: 2, title: "Describe Your Day", description: "Talk about your daily routine", completed: false },
      { day: 3, title: "Tell a Story", description: "Share a memorable experience", completed: false },
      { day: 4, title: "Give an Opinion", description: "Express your view on a topic", completed: false },
      { day: 5, title: "Ask Questions", description: "Practice asking follow-up questions", completed: false },
      { day: 6, title: "Role Play", description: "Simulate a real-world conversation", completed: false },
      { day: 7, title: "Final Presentation", description: "Give a 3-minute presentation", completed: false },
    ],
  },
  {
    id: "ch3",
    title: "Grammar Mastery: 14-Day Intensive",
    description: "Tackle the most common grammar mistakes in 14 focused days. Each day covers one grammar rule with explanations, examples, and practice exercises.",
    image: "COURSE_FRENCH",
    duration: "14 days",
    daysTotal: 14,
    daysCompleted: 14,
    participants: 678,
    prize: "Grammar Champion Badge",
    startDate: "Jan 15, 2026",
    endDate: "Jan 28, 2026",
    host: { name: "Sophie Laurent", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
    tags: ["Grammar", "Intensive", "Intermediate"],
    status: "completed",
    days: Array.from({ length: 14 }, (_, i) => ({
      day: i + 1,
      title: `Grammar Rule ${i + 1}`,
      description: `Master grammar concept ${i + 1}`,
      completed: true,
    })),
  },
];

// ---- WRITING CORRECTIONS / NOTEBOOK (Italki-inspired) ----

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;
}

export interface NotebookEntry {
  id: string;
  author: { name: string; avatar: string; nativeLanguage: string };
  title: string;
  text: string;
  language: string;
  date: string;
  corrections: Correction[];
  correctedBy?: { name: string; avatar: string };
  status: "pending" | "corrected" | "perfect";
  likes: number;
}

export const notebookEntries: NotebookEntry[] = [
  {
    id: "n1",
    author: { name: "Carlos Rivera", avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face", nativeLanguage: "Spanish" },
    title: "My First Day at Work",
    text: "Yesterday I have started my new job in a big company. I was very nervous because I didn't knew nobody. My boss showed me the office and introduced me to my colleagues. Everyone was very nice and helped me to understand my tasks. I hope I will enjoy working here.",
    language: "English",
    date: "Feb 12, 2026",
    corrections: [
      { original: "I have started", corrected: "I started", explanation: "Use simple past for completed actions with a specific time reference (yesterday)." },
      { original: "I didn't knew nobody", corrected: "I didn't know anybody", explanation: "Use base form after 'didn't' and avoid double negatives." },
      { original: "helped me to understand", corrected: "helped me understand", explanation: "'Help' can be followed directly by the infinitive without 'to'." },
    ],
    correctedBy: { name: "Lindsay", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
    status: "corrected",
    likes: 8,
  },
  {
    id: "n2",
    author: { name: "Fatima Al-Rashid", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face", nativeLanguage: "Arabic" },
    title: "Mon voyage à Paris",
    text: "La semaine dernière, je suis allée à Paris pour la première fois. J'ai visité la Tour Eiffel et le Louvre. La nourriture était délicieuse, surtout les croissants du matin. Je voudrais y retourner l'année prochaine.",
    language: "French",
    date: "Feb 11, 2026",
    corrections: [],
    status: "perfect",
    likes: 12,
  },
  {
    id: "n3",
    author: { name: "David Kim", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face", nativeLanguage: "Korean" },
    title: "Why I Learn English",
    text: "I started learning English since I was 10 years old. In Korea, English is very important for getting a good job. I want to improve my speaking skill because I am shy to talk with foreigners. My dream is working in an international company and traveling around the world.",
    language: "English",
    date: "Feb 10, 2026",
    corrections: [],
    status: "pending",
    likes: 3,
  },
  {
    id: "n4",
    author: { name: "Elena Popova", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face", nativeLanguage: "Russian" },
    title: "A Rainy Day",
    text: "Today it was raining all day so I decided to stay at home and read a book. I made myself a cup of hot chocolate and sat by the window. The sound of rain is very relaxing for me. I finished reading two chapters before I fell asleep on the couch.",
    language: "English",
    date: "Feb 9, 2026",
    corrections: [],
    status: "perfect",
    likes: 15,
  },
];

// ---- POINT ACTIONS (how users earn points) ----

export interface PointAction {
  action: string;
  points: number;
  icon: string;
}

export const pointActions: PointAction[] = [
  { action: "Create a post", points: 10, icon: "📝" },
  { action: "Comment on a post", points: 5, icon: "💬" },
  { action: "Receive a like", points: 2, icon: "❤️" },
  { action: "Complete a lesson", points: 15, icon: "📖" },
  { action: "Finish a course module", points: 50, icon: "🎯" },
  { action: "Complete a challenge day", points: 20, icon: "⚡" },
  { action: "Correct someone's writing", points: 25, icon: "✍️" },
  { action: "Attend a live event", points: 30, icon: "🎥" },
  { action: "Daily login streak", points: 5, icon: "🔥" },
  { action: "Earn a badge", points: 100, icon: "🏅" },
];
