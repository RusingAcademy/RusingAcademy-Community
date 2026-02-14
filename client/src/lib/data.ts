// ============================================================
// DESIGN: "Soft Social" — Warm, approachable, rounded, tactile
// Color: White base, #FF4B2B CTA, #2EC4B6 accents
// Font: Plus Jakarta Sans 400/600/800
// ============================================================

export interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: "Community Tutor" | "Professional Teacher" | "Student" | "Official";
  };
  title: string;
  excerpt: string;
  image?: string;
  date: string;
  comments: number;
  likes: number;
  tags?: string[];
  type: "article" | "podcast" | "exercise" | "question";
  hasReadMore?: boolean;
  audioTitle?: string;
  quizOptions?: string[];
  quizCount?: number;
}

export interface Teacher {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  lessons: number;
  priceFrom: number;
}

export interface Topic {
  id: string;
  name: string;
  image: string;
}

export interface EditorPick {
  id: string;
  title: string;
  image: string;
  likes: number;
  comments: number;
}

export const topics: Topic[] = [
  {
    id: "1",
    name: "#LanguageChallenge",
    image: "TOPIC_LANGUAGE_CHALLENGE",
  },
  {
    id: "2",
    name: "#GroupClass",
    image: "TOPIC_GROUP_CLASS",
  },
  {
    id: "3",
    name: "#TongueTwister",
    image: "TOPIC_TONGUE_TWISTER",
  },
  {
    id: "4",
    name: "#TrendingWords",
    image: "TOPIC_TRENDING_WORDS",
  },
  {
    id: "5",
    name: "#FutureMe",
    image: "TOPIC_LANGUAGE_CHALLENGE",
  },
  {
    id: "6",
    name: "#DailyVocabulary",
    image: "TOPIC_TRENDING_WORDS",
  },
];

export const posts: Post[] = [
  {
    id: "1",
    author: {
      name: "Samuel Fuentes",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: 'Why "General English" is Failing Your Career',
    excerpt: 'The "Language Bug" in Professional Growth — As a Systems Engineer and Full-Stack Developer, I\'ve spent my life debugging complex code and optimizing architectures...',
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&h=150&fit=crop",
    date: "Feb 5, 2026 9:41 AM",
    comments: 7,
    likes: 9,
    tags: [],
    type: "article",
  },
  {
    id: "2",
    author: {
      name: "Natalie",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: '"Just Around the Corner" Is (Usually) a Lie',
    excerpt: "If you have ever asked for directions in English and ended up walking far longer than expected, you are not alone. Somewhere along the way, a friendly stranger probably sm...",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=200&h=150&fit=crop",
    date: "Feb 5, 2026 8:24 AM",
    comments: 4,
    likes: 8,
    tags: [],
    type: "article",
  },
  {
    id: "3",
    author: {
      name: "Anele Xaba",
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: "Why Many Kids Struggle With English — and How the Right Tutor Makes a Difference",
    excerpt: "Does this sound familiar? You've invested in apps, books, and online courses for your child, yet their English skills aren't improving as fast as you'd hoped...",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=150&fit=crop",
    date: "Feb 4, 2026 5:30 PM",
    comments: 2,
    likes: 2,
    tags: [],
    type: "article",
  },
  {
    id: "4",
    author: {
      name: "Charnelle (Business)",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: "English for Customer Service: Dealing with Clients Professionally",
    excerpt: "Customer service is an essential part of business. Providing excellent service helps maintain client satisfaction, build loyalty, and create a positive company reputation. Fo...",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=200&h=150&fit=crop",
    date: "Feb 4, 2026 4:55 PM",
    comments: 1,
    likes: 6,
    tags: [],
    type: "article",
  },
  {
    id: "5",
    author: {
      name: "Lindsay",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "25 Popular And Modern English Idioms: Explained",
    excerpt: "What is it about idioms that makes learning them so satisfying? This article should help you \"step your English game up\" with plenty of these popular expressions from...",
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200&h=150&fit=crop",
    date: "March 8, 2017",
    comments: 15,
    likes: 86,
    tags: [],
    type: "article",
  },
  {
    id: "6",
    author: {
      name: "Jack Davidson",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: "The Gift That Keeps On Giving",
    excerpt: "Everyone likes to receive gifts! From friends, family, and strangers too! But what do gifts have to do with language learning? Find out now.",
    image: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=200&h=150&fit=crop",
    date: "July 21, 2016",
    comments: 3,
    likes: 12,
    tags: [],
    type: "article",
  },
  {
    id: "7",
    author: {
      name: "Jordan",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: "Back-to-School English: 15 Must-Know Phrases for the Classroom",
    excerpt: "So, it's that time again. Fresh notebooks, new teachers, and the familiar buzz of the classroom. Whether you're heading back to school or just want to brush up...",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=150&fit=crop",
    date: "August 18, 2025",
    comments: 17,
    likes: 55,
    tags: [],
    type: "article",
  },
];

export const podcastPosts: Post[] = [
  {
    id: "p1",
    author: {
      name: "LIZ UK",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "EP 4: BOOST YOUR SPEAKING TEST SCORE (PART 1)",
    excerpt: "In this episode, I will give you some great tips on how to boost your chances of a high score in your speaking test — NOT by memorising fancy, risky words, but by using safe, flexible, high-scoring vocabulary that will impress the examiners...",
    date: "Feb 12, 2026 4:17 PM",
    comments: 0,
    likes: 1,
    tags: ["#Podcasts"],
    type: "podcast",
    audioTitle: "EP 4: BOOST YOUR SPEAKING TEST SCORE (PART 1)",
  },
  {
    id: "p2",
    author: {
      name: "Teacher Alyse",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "Captain Seasalt and the ABC Pirates — Letter C",
    excerpt: "Hi, and welcome back to Captain Seasalt and the ABC Pirates with Teacher Alyse! Today, we're going on an adventure to learn words that start with the letter C. Are you ready? Listen carefully, repeat after me...",
    date: "Feb 11, 2026",
    comments: 0,
    likes: 1,
    tags: ["#EnglishLeague", "#HelpMePronounce"],
    type: "podcast",
    audioTitle: "Letter C",
    hasReadMore: true,
  },
  {
    id: "p3",
    author: {
      name: "Nick IELTS Examiner",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "SPECIAL EPISODE — How to answer IELTS Part 2",
    excerpt: "Being able to talk on a wide variety of topics is really helpful for getting a higher mark on the IELTS test. In this podcast episode, I'll share strategies that actually work...",
    date: "Feb 10, 2026",
    comments: 0,
    likes: 2,
    tags: [],
    type: "podcast",
    audioTitle: "SPECIAL EPISODE - How to answer IELTS Part 2",
  },
];

export const exercisePosts: Post[] = [
  {
    id: "e1",
    author: {
      name: "Mina-IELTS&Business",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "Fill in the blank",
    excerpt: "After hours of negotiation, they refused to ________ to the unreasonable demands.",
    date: "4 hours ago",
    comments: 0,
    likes: 0,
    tags: ["#EnglishLeague", "#HelpMeCorrect", "#DailyVocabulary"],
    type: "exercise",
    quizOptions: ["give on", "give in", "let in", "let on"],
    quizCount: 5,
  },
  {
    id: "e2",
    author: {
      name: "Henda Elteir",
      avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "Vocabulary Quiz",
    excerpt: "Money a business or organization earns.",
    date: "Feb 10, 2026",
    comments: 0,
    likes: 0,
    tags: ["#TrendingWords", "#DailyVocabulary"],
    type: "exercise",
    quizOptions: ["Revenue", "Venue"],
    quizCount: 23,
  },
  {
    id: "e3",
    author: {
      name: "Alexander Poloupanov",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
      role: "Professional Teacher",
    },
    title: "Winter Safety Quiz",
    excerpt: 'What is "black ice"?',
    date: "Feb 8, 2026",
    comments: 0,
    likes: 0,
    tags: ["#DailyVocabulary", "#MyFavoriteSeason"],
    type: "exercise",
    quizOptions: [
      "Ice that is deliberately colored black",
      "A new, trendy flavor of ice cream",
      "A thin, transparent, and very slippery ice layer",
      "Ice that only forms during the night",
    ],
    quizCount: 0,
  },
];

export const questionPosts: Post[] = [
  {
    id: "q1",
    author: {
      name: "Roman Kosolapov",
      avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=80&h=80&fit=crop&crop=face",
      role: "Student",
    },
    title: "Grammar construction help",
    excerpt: 'Please help me figure a grammar construction out. Does the sentence seem correctly? "The remarks are the same as they were previously."',
    date: "Feb 12, 2026 7:08 PM",
    comments: 0,
    likes: 0,
    tags: [],
    type: "question",
    hasReadMore: true,
  },
  {
    id: "q2",
    author: {
      name: "Pelin",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
      role: "Student",
    },
    title: "Interchangeable phrases?",
    excerpt: "Can I use these interchangeably? My nose is blocked. My nose is clogged. My nose is stuffy. My nose is stuffed.",
    date: "Feb 12, 2026 10:13 AM",
    comments: 1,
    likes: 0,
    tags: [],
    type: "question",
  },
  {
    id: "q3",
    author: {
      name: "Mtir Rebahi",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: "Teaching difficulties on the platform",
    excerpt: "What are the difficulties that you face in teaching Arabic or English, or any other language in the platform?",
    date: "Feb 12, 2026 9:02 AM",
    comments: 0,
    likes: 1,
    tags: ["#GroupClass"],
    type: "question",
  },
  {
    id: "q4",
    author: {
      name: "Yazdan",
      avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&crop=face",
      role: "Community Tutor",
    },
    title: "What's your favorite teacher type?",
    excerpt: "1: A strict teacher with a firm and rigid method of teaching following books and grammar rules. 2: A friendly teacher who adapts to the student's needs...",
    date: "Feb 11, 2026",
    comments: 0,
    likes: 0,
    tags: [],
    type: "question",
  },
];

export const teachers: Teacher[] = [
  {
    id: "1",
    name: "SilvieGuth",
    avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100&h=100&fit=crop&crop=face",
    rating: 5.0,
    lessons: 1814,
    priceFrom: 5,
  },
  {
    id: "2",
    name: "Carlos",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    rating: 5.0,
    lessons: 9896,
    priceFrom: 7,
  },
  {
    id: "3",
    name: "Paola Martínez",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    rating: 5.0,
    lessons: 478,
    priceFrom: 10,
  },
  {
    id: "4",
    name: "Uri Quintal",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5.0,
    lessons: 2603,
    priceFrom: 8,
  },
  {
    id: "5",
    name: "Maritza Polanco",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face",
    rating: 5.0,
    lessons: 2515,
    priceFrom: 8,
  },
];

export const editorPicks: EditorPick[] = [
  {
    id: "1",
    title: 'Why "General English" is Failing Your Career',
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=120&h=80&fit=crop",
    likes: 9,
    comments: 7,
  },
  {
    id: "2",
    title: "Carnival in Portugal: History, Traditions, Regional...",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=120&h=80&fit=crop",
    likes: 3,
    comments: 4,
  },
  {
    id: "3",
    title: "Why Many Kids Struggle With English...",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=120&h=80&fit=crop",
    likes: 2,
    comments: 2,
  },
  {
    id: "4",
    title: "Italian Passive Voice",
    image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=120&h=80&fit=crop",
    likes: 2,
    comments: 1,
  },
  {
    id: "5",
    title: "Start Your Korean Journey: 4 Charming Picture Books...",
    image: "https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=120&h=80&fit=crop",
    likes: 1,
    comments: 0,
  },
];

export const dailyPracticePrompts = [
  "What can we do in the face of extreme weather?",
  'Use "New Year\'s Resolution" and 3 other words to make a sentence.',
  "Why do we learn a new language now that translation software is very accessible?",
  "True or false: happy wife, happy life?",
  "Try some tongue twisters in your learning language.",
  "Which is a better diet? Veg or non-veg?",
];
