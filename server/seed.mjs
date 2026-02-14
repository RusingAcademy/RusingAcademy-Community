/**
 * Database Seed Script — Community Hub
 * Seeds the database with realistic RusingAcademy-branded content.
 * Run: node server/seed.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

async function seed() {
  console.log('🌱 Seeding Community Hub database...\n');

  // ── 1. Forum Categories ──────────────────────────────────────────
  console.log('📂 Creating forum categories...');
  await conn.execute(`DELETE FROM thread_likes`);
  await conn.execute(`DELETE FROM post_likes`);
  await conn.execute(`DELETE FROM forum_posts`);
  await conn.execute(`DELETE FROM forum_threads`);
  await conn.execute(`DELETE FROM forum_categories`);

  const categories = [
    { name: 'General Discussion', nameFr: 'Discussion Générale', description: 'Open conversations about language learning', descriptionFr: 'Conversations ouvertes sur l\'apprentissage des langues', slug: 'general', icon: 'MessageCircle', color: '#4F46E5', sortOrder: 1 },
    { name: 'SLE Exam Prep', nameFr: 'Préparation ELS', description: 'Tips and strategies for SLE exams', descriptionFr: 'Conseils et stratégies pour les examens ELS', slug: 'sle-prep', icon: 'GraduationCap', color: '#DC2626', sortOrder: 2 },
    { name: 'French Practice', nameFr: 'Pratique du Français', description: 'Practice your French with the community', descriptionFr: 'Pratiquez votre français avec la communauté', slug: 'french-practice', icon: 'Languages', color: '#2563EB', sortOrder: 3 },
    { name: 'Career & Public Service', nameFr: 'Carrière & Fonction Publique', description: 'Career advancement and bilingualism in the public service', descriptionFr: 'Avancement de carrière et bilinguisme dans la fonction publique', slug: 'career', icon: 'Briefcase', color: '#059669', sortOrder: 4 },
    { name: 'Success Stories', nameFr: 'Histoires de Réussite', description: 'Share your achievements and milestones', descriptionFr: 'Partagez vos réalisations et jalons', slug: 'success-stories', icon: 'Trophy', color: '#D97706', sortOrder: 5 },
    { name: 'Podcasts & Media', nameFr: 'Podcasts & Médias', description: 'Audio content and media discussions', descriptionFr: 'Contenu audio et discussions médiatiques', slug: 'podcasts', icon: 'Headphones', color: '#7C3AED', sortOrder: 6 },
  ];

  for (const cat of categories) {
    await conn.execute(
      `INSERT INTO forum_categories (name, nameFr, description, descriptionFr, slug, icon, color, sortOrder, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [cat.name, cat.nameFr, cat.description, cat.descriptionFr, cat.slug, cat.icon, cat.color, cat.sortOrder]
    );
  }
  console.log(`  ✅ ${categories.length} categories created`);

  // ── 2. Forum Threads (Community Posts) ────────────────────────────
  console.log('📝 Creating forum threads...');
  const [catRows] = await conn.execute(`SELECT id, slug FROM forum_categories`);
  const catMap = {};
  for (const r of catRows) catMap[r.slug] = r.id;

  const threads = [
    // General
    { catSlug: 'general', title: 'Welcome to the RusingAcademy Community!', slug: 'welcome-community', content: 'Bienvenue! Welcome to our learning community. This is a safe space to practice, share, and grow together. Whether you\'re preparing for your SLE exams, improving your conversational French, or advancing your career in the public service, you\'re in the right place. Introduce yourself and tell us about your language learning goals!', contentType: 'article', likeCount: 47, replyCount: 23, viewCount: 312 },
    { catSlug: 'general', title: 'How I Went From Level A to Level C in 6 Months', slug: 'level-a-to-c-journey', content: 'Six months ago, I could barely string together a sentence in French. Today, I passed my SLE oral exam at Level C. Here\'s exactly what I did, week by week, and the resources that made the biggest difference. The key was consistency — 45 minutes every single day, no exceptions. I used RusingAcademy\'s structured approach combined with daily conversation practice...', contentType: 'article', likeCount: 89, replyCount: 34, viewCount: 1245 },
    // SLE Prep
    { catSlug: 'sle-prep', title: 'SLE Oral Exam: The 5 Most Common Mistakes (and How to Avoid Them)', slug: 'sle-oral-common-mistakes', content: 'After coaching hundreds of public servants through their SLE oral exams, I\'ve identified the five most common mistakes that prevent candidates from reaching Level C. Mistake #1: Translating from English instead of thinking in French. Mistake #2: Using overly complex structures when simple ones would score higher. Mistake #3: Not managing your time during the spontaneous speaking section...', contentType: 'article', likeCount: 156, replyCount: 42, viewCount: 2890 },
    { catSlug: 'sle-prep', title: 'Written Expression Tips: Mastering the Email Format', slug: 'written-expression-email', content: 'The written expression section of the SLE often includes an email writing task. Here are the key formulas and structures you need to master: Opening formulas (Madame, Monsieur vs. Cher collègue), transition phrases, and closing formulas. Remember: clarity and structure score higher than vocabulary complexity.', contentType: 'article', likeCount: 72, replyCount: 18, viewCount: 1567 },
    // French Practice
    { catSlug: 'french-practice', title: 'Daily Challenge: Describe Your Morning Routine in French', slug: 'daily-challenge-morning-routine', content: 'Bonjour à tous! Today\'s practice challenge: Write a paragraph describing your morning routine using the present tense. Try to include at least 5 reflexive verbs (se réveiller, se lever, se préparer, etc.). I\'ll start: "Je me réveille à 6h30 chaque matin. Je me lève immédiatement et je me dirige vers la cuisine pour préparer mon café..."', contentType: 'exercise', likeCount: 34, replyCount: 28, viewCount: 456 },
    { catSlug: 'french-practice', title: 'Tongue Twister Challenge: "Les chaussettes de l\'archiduchesse"', slug: 'tongue-twister-challenge', content: 'Let\'s practice our pronunciation! Try saying this classic French tongue twister 5 times fast: "Les chaussettes de l\'archiduchesse sont-elles sèches, archi-sèches?" Record yourself and share your attempt. Don\'t worry about being perfect — the goal is to have fun while improving your pronunciation!', contentType: 'exercise', likeCount: 45, replyCount: 31, viewCount: 678 },
    // Career
    { catSlug: 'career', title: 'How Bilingualism Changed My Career Trajectory in the Federal Government', slug: 'bilingualism-career-change', content: 'Three years ago, I was stuck at the PM-04 level. My performance reviews were excellent, but every EX-minus-1 position required CBC. After investing in my French with RusingAcademy\'s intensive program, I achieved my Level C in oral and written. Within 8 months, I was promoted to PM-06 and am now acting as Director. Bilingualism isn\'t just a requirement — it\'s a career accelerator.', contentType: 'article', likeCount: 203, replyCount: 56, viewCount: 3421 },
    // Success Stories
    { catSlug: 'success-stories', title: '🎉 I Passed My SLE Oral at Level C! Thank You RusingAcademy!', slug: 'passed-sle-oral-c', content: 'I am thrilled to share that I received my SLE oral results today — LEVEL C! After two previous attempts where I scored B, I enrolled in RusingAcademy\'s intensive coaching program. The difference was night and day. Coach Steven helped me identify my specific weak points and we worked on them systematically. The mock exams were incredibly realistic and prepared me for exactly what to expect. If you\'re struggling, don\'t give up — the right approach makes all the difference!', contentType: 'article', likeCount: 312, replyCount: 67, viewCount: 4567 },
    // Podcasts
    { catSlug: 'podcasts', title: 'Podcast: The 4 Stages of Language Learning — From Conscious to Unconscious Competence', slug: 'podcast-4-stages-learning', content: 'In this episode, we explore the four stages every language learner goes through: unconscious incompetence, conscious incompetence, conscious competence, and finally unconscious competence. Understanding where you are in this journey can help you set realistic expectations and celebrate your progress. Listen now and discover which stage you\'re in!', contentType: 'podcast', audioUrl: 'https://example.com/podcast-4-stages.mp3', audioDurationSeconds: 1845, likeCount: 67, replyCount: 12, viewCount: 890 },
    { catSlug: 'podcasts', title: 'Podcast: Mastering the Passé Composé vs. Imparfait — Once and For All', slug: 'podcast-passe-compose-imparfait', content: 'The eternal question for French learners: when do I use the passé composé and when do I use the imparfait? In this episode, we break down the rules with clear examples from everyday professional contexts. By the end, you\'ll have a simple mental framework that works every time.', contentType: 'podcast', audioUrl: 'https://example.com/podcast-passe-compose.mp3', audioDurationSeconds: 2340, likeCount: 94, replyCount: 21, viewCount: 1234 },
    // Questions
    { catSlug: 'general', title: 'What\'s the Best Way to Prepare for the SLE Reading Comprehension?', slug: 'best-way-sle-reading', content: 'I have my SLE reading comprehension exam in 3 weeks. I\'ve been reading Le Devoir and Radio-Canada articles daily, but I\'m not sure if that\'s enough. What strategies worked for you? Any specific resources or techniques you\'d recommend? I\'m currently at a solid B level and need to reach C.', contentType: 'question', likeCount: 28, replyCount: 19, viewCount: 567 },
    { catSlug: 'general', title: 'Is It Normal to Feel Like You\'re Going Backwards?', slug: 'feeling-going-backwards', content: 'I\'ve been studying French intensively for 2 months now, and lately I feel like I\'m getting worse, not better. I make mistakes on things I used to get right. My confidence is dropping. Has anyone else experienced this? Is this the "plateau" people talk about?', contentType: 'question', likeCount: 156, replyCount: 43, viewCount: 2345 },
  ];

  for (const t of threads) {
    await conn.execute(
      `INSERT INTO forum_threads (categoryId, authorId, title, slug, content, contentType, audioUrl, audioDurationSeconds, likeCount, replyCount, viewCount, status, createdAt) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*30) DAY))`,
      [catMap[t.catSlug], t.title, t.slug, t.content, t.contentType, t.audioUrl || null, t.audioDurationSeconds || null, t.likeCount, t.replyCount, t.viewCount]
    );
  }
  console.log(`  ✅ ${threads.length} forum threads created`);

  // ── 3. Courses ────────────────────────────────────────────────────
  console.log('📚 Creating courses...');
  await conn.execute(`DELETE FROM lesson_progress`);
  await conn.execute(`DELETE FROM course_enrollments`);
  await conn.execute(`DELETE FROM lessons`);
  await conn.execute(`DELETE FROM course_modules`);
  await conn.execute(`DELETE FROM courses`);

  const coursesData = [
    { title: 'SLE Oral Exam — Intensive Preparation', titleFr: 'Examen oral ELS — Préparation intensive', slug: 'sle-oral-intensive', description: 'A comprehensive 8-week program designed to take you from Level B to Level C in oral proficiency. Includes mock exams, structured practice sessions, and personalized feedback from certified coaches.', descriptionFr: 'Un programme complet de 8 semaines conçu pour vous faire passer du niveau B au niveau C à l\'oral.', shortDescription: 'From Level B to C in 8 weeks with mock exams and coaching.', category: 'sle_oral', level: 'intermediate', targetLanguage: 'french', totalModules: 4, totalLessons: 16, totalDurationMinutes: 960, totalEnrollments: 234, averageRating: '4.87', totalReviews: 89, instructorName: 'Steven Barholere', status: 'published' },
    { title: 'SLE Written Expression Mastery', titleFr: 'Maîtrise de l\'expression écrite ELS', slug: 'sle-written-mastery', description: 'Master the written expression section of the SLE with structured templates, grammar deep-dives, and timed practice exercises. Learn the exact formulas that evaluators look for.', descriptionFr: 'Maîtrisez la section d\'expression écrite de l\'ELS avec des modèles structurés et des exercices pratiques.', shortDescription: 'Master SLE written expression with proven templates.', category: 'sle_written', level: 'intermediate', targetLanguage: 'french', totalModules: 3, totalLessons: 12, totalDurationMinutes: 720, totalEnrollments: 178, averageRating: '4.92', totalReviews: 67, instructorName: 'Steven Barholere', status: 'published' },
    { title: 'Business French for Professionals', titleFr: 'Français des affaires pour professionnels', slug: 'business-french-professionals', description: 'Develop professional French communication skills for meetings, presentations, emails, and reports. Tailored specifically for Canadian public servants and corporate professionals.', descriptionFr: 'Développez vos compétences en communication professionnelle en français.', shortDescription: 'Professional French for meetings, emails, and presentations.', category: 'business_french', level: 'intermediate', targetLanguage: 'french', totalModules: 5, totalLessons: 20, totalDurationMinutes: 1200, totalEnrollments: 312, averageRating: '4.78', totalReviews: 112, instructorName: 'Sue-Anne Richer', status: 'published' },
    { title: 'French Grammar Fundamentals', titleFr: 'Fondamentaux de la grammaire française', slug: 'french-grammar-fundamentals', description: 'Build a rock-solid foundation in French grammar. From verb conjugations to complex sentence structures, this course covers everything you need to write and speak with confidence.', descriptionFr: 'Construisez une base solide en grammaire française.', shortDescription: 'Master French grammar from basics to advanced structures.', category: 'grammar', level: 'beginner', targetLanguage: 'french', totalModules: 6, totalLessons: 24, totalDurationMinutes: 1440, totalEnrollments: 456, averageRating: '4.85', totalReviews: 156, instructorName: 'Preciosa Baganha', status: 'published' },
    { title: 'SLE Reading Comprehension Strategies', titleFr: 'Stratégies de compréhension de lecture ELS', slug: 'sle-reading-strategies', description: 'Learn proven strategies for tackling the SLE reading comprehension exam. Includes practice texts, time management techniques, and vocabulary building exercises.', descriptionFr: 'Apprenez des stratégies éprouvées pour l\'examen de compréhension de lecture ELS.', shortDescription: 'Proven strategies for the SLE reading exam.', category: 'sle_reading', level: 'intermediate', targetLanguage: 'french', totalModules: 3, totalLessons: 12, totalDurationMinutes: 600, totalEnrollments: 198, averageRating: '4.81', totalReviews: 72, instructorName: 'Erika Seguin', status: 'published' },
    { title: 'Conversational French — Daily Practice', titleFr: 'Français conversationnel — Pratique quotidienne', slug: 'conversational-french-daily', description: 'Build your conversational confidence with daily practice scenarios drawn from real workplace situations. Perfect for public servants who need to use French in meetings and informal exchanges.', descriptionFr: 'Développez votre confiance conversationnelle avec des scénarios de pratique quotidienne.', shortDescription: 'Daily conversation practice for workplace French.', category: 'conversation', level: 'all_levels', targetLanguage: 'french', totalModules: 4, totalLessons: 20, totalDurationMinutes: 800, totalEnrollments: 267, averageRating: '4.90', totalReviews: 98, instructorName: 'Steven Barholere', status: 'published' },
  ];

  for (const c of coursesData) {
    await conn.execute(
      `INSERT INTO courses (title, titleFr, slug, description, descriptionFr, shortDescription, category, level, targetLanguage, totalModules, totalLessons, totalDurationMinutes, totalEnrollments, averageRating, totalReviews, instructorName, status, publishedAt, hasCertificate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), true)`,
      [c.title, c.titleFr, c.slug, c.description, c.descriptionFr, c.shortDescription, c.category, c.level, c.targetLanguage, c.totalModules, c.totalLessons, c.totalDurationMinutes, c.totalEnrollments, c.averageRating, c.totalReviews, c.instructorName, c.status]
    );
  }
  console.log(`  ✅ ${coursesData.length} courses created`);

  // ── 3b. Course Modules & Lessons (for first course) ───────────────
  console.log('📖 Creating modules and lessons for SLE Oral Intensive...');
  const [[firstCourse]] = await conn.execute(`SELECT id FROM courses WHERE slug = 'sle-oral-intensive' LIMIT 1`);
  const courseId = firstCourse.id;

  const modules = [
    { title: 'Foundation: Building Oral Confidence', titleFr: 'Fondation : Développer la confiance orale', sortOrder: 1, totalLessons: 4, totalDurationMinutes: 240 },
    { title: 'Structured Speaking: Frameworks & Templates', titleFr: 'Expression structurée : Cadres et modèles', sortOrder: 2, totalLessons: 4, totalDurationMinutes: 240 },
    { title: 'Spontaneous Expression: Thinking in French', titleFr: 'Expression spontanée : Penser en français', sortOrder: 3, totalLessons: 4, totalDurationMinutes: 240 },
    { title: 'Exam Simulation & Final Preparation', titleFr: 'Simulation d\'examen et préparation finale', sortOrder: 4, totalLessons: 4, totalDurationMinutes: 240 },
  ];

  for (const m of modules) {
    await conn.execute(
      `INSERT INTO course_modules (courseId, title, titleFr, sortOrder, totalLessons, totalDurationMinutes, status) VALUES (?, ?, ?, ?, ?, ?, 'published')`,
      [courseId, m.title, m.titleFr, m.sortOrder, m.totalLessons, m.totalDurationMinutes]
    );
  }

  const [moduleRows] = await conn.execute(`SELECT id, sortOrder FROM course_modules WHERE courseId = ? ORDER BY sortOrder`, [courseId]);

  const lessonsByModule = [
    // Module 1
    ['Introduction to the SLE Oral Exam Format', 'Common Pitfalls and How to Avoid Them', 'Building Your French Vocabulary Base', 'Pronunciation Essentials for Level C'],
    // Module 2
    ['The STAR Method for Oral Responses', 'Transition Phrases That Impress Evaluators', 'Structuring Complex Arguments in French', 'Practice Session: Structured Responses'],
    // Module 3
    ['Thinking in French: Breaking the Translation Habit', 'Handling Unexpected Questions with Confidence', 'Expressing Nuanced Opinions', 'Practice Session: Spontaneous Speaking'],
    // Module 4
    ['Full Mock Exam #1 with Feedback', 'Full Mock Exam #2 with Feedback', 'Last-Minute Tips and Strategies', 'Exam Day: What to Expect and How to Excel'],
  ];

  for (let mi = 0; mi < moduleRows.length; mi++) {
    const modId = moduleRows[mi].id;
    for (let li = 0; li < lessonsByModule[mi].length; li++) {
      await conn.execute(
        `INSERT INTO lessons (moduleId, courseId, title, contentType, sortOrder, estimatedMinutes, status) VALUES (?, ?, ?, 'video', ?, 60, 'published')`,
        [modId, courseId, lessonsByModule[mi][li], li + 1]
      );
    }
  }
  console.log(`  ✅ ${modules.length} modules, ${modules.length * 4} lessons created`);

  // ── 4. Community Events ───────────────────────────────────────────
  console.log('📅 Creating community events...');
  await conn.execute(`DELETE FROM event_registrations`);
  await conn.execute(`DELETE FROM community_events`);

  const events = [
    { title: 'SLE Oral Mock Exam — Live Practice Session', titleFr: 'Simulation orale ELS — Séance de pratique en direct', description: 'Join us for a live mock SLE oral exam session. Practice with real scenarios, receive immediate feedback from Coach Steven, and learn from other candidates\' performances. Limited to 12 participants for personalized attention.', descriptionFr: 'Rejoignez-nous pour une simulation en direct de l\'examen oral ELS.', slug: 'sle-oral-mock-march-2026', eventType: 'workshop', daysFromNow: 7, durationHours: 2, maxCapacity: 12, currentRegistrations: 9, hostName: 'Steven Barholere', status: 'published' },
    { title: 'French Conversation Circle — Intermediate Level', titleFr: 'Cercle de conversation française — Niveau intermédiaire', description: 'A relaxed, supportive environment to practice your French conversation skills. Each session focuses on a different theme drawn from professional contexts. No judgment, just practice and progress!', descriptionFr: 'Un environnement détendu et bienveillant pour pratiquer vos compétences en conversation française.', slug: 'conversation-circle-march', eventType: 'practice', daysFromNow: 3, durationHours: 1.5, maxCapacity: 20, currentRegistrations: 14, hostName: 'Sue-Anne Richer', status: 'published' },
    { title: 'Webinar: Career Advancement Through Bilingualism', titleFr: 'Webinaire : Avancement de carrière par le bilinguisme', description: 'Discover how bilingualism can accelerate your career in the Canadian public service. Hear from three public servants who leveraged their language skills to reach executive positions. Q&A session included.', descriptionFr: 'Découvrez comment le bilinguisme peut accélérer votre carrière dans la fonction publique canadienne.', slug: 'webinar-career-bilingualism', eventType: 'webinar', daysFromNow: 14, durationHours: 1.5, maxCapacity: 100, currentRegistrations: 67, hostName: 'Steven Barholere', status: 'published' },
    { title: 'Grammar Workshop: Subjunctive Mood Demystified', titleFr: 'Atelier grammaire : Le subjonctif démystifié', description: 'The subjunctive mood is one of the most feared aspects of French grammar. In this interactive workshop, we\'ll break it down into simple, memorable rules with plenty of practice exercises. You\'ll leave confident in when and how to use the subjunctive.', descriptionFr: 'Le subjonctif est l\'un des aspects les plus redoutés de la grammaire française.', slug: 'grammar-workshop-subjunctive', eventType: 'workshop', daysFromNow: 10, durationHours: 2, maxCapacity: 25, currentRegistrations: 18, hostName: 'Preciosa Baganha', status: 'published' },
    { title: 'Networking: Public Servants Language Learning Community', titleFr: 'Réseautage : Communauté d\'apprentissage des langues des fonctionnaires', description: 'Connect with fellow public servants on the same language learning journey. Share tips, form study groups, and build a support network. Light and informal — bring your coffee!', descriptionFr: 'Connectez-vous avec d\'autres fonctionnaires sur le même parcours d\'apprentissage des langues.', slug: 'networking-public-servants', eventType: 'networking', daysFromNow: 5, durationHours: 1, maxCapacity: 50, currentRegistrations: 32, hostName: 'Steven Barholere', status: 'published' },
    { title: 'Livestream: Ask Me Anything — SLE Exam Tips', titleFr: 'En direct : Posez-moi vos questions — Conseils ELS', description: 'Got questions about the SLE exams? Join Coach Steven for a live Q&A session where no question is off-limits. From study strategies to exam-day tips, get answers from someone who has helped hundreds of candidates succeed.', descriptionFr: 'Vous avez des questions sur les examens ELS? Rejoignez le Coach Steven pour une séance de questions-réponses en direct.', slug: 'livestream-ama-sle', eventType: 'livestream', daysFromNow: 21, durationHours: 1, maxCapacity: 200, currentRegistrations: 89, hostName: 'Steven Barholere', status: 'published' },
  ];

  for (const e of events) {
    const durationMinutes = Math.round(e.durationHours * 60);
    await conn.execute(
      `INSERT INTO community_events (title, titleFr, description, descriptionFr, slug, eventType, startAt, endAt, timezone, maxCapacity, currentRegistrations, hostName, status, locationDetails, meetingUrl) VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL ? DAY), INTERVAL ? MINUTE), 'America/Toronto', ?, ?, ?, ?, 'Online — Zoom', 'https://zoom.us/j/community-hub')`,
      [e.title, e.titleFr, e.description, e.descriptionFr, e.slug, e.eventType, e.daysFromNow, e.daysFromNow, durationMinutes, e.maxCapacity, e.currentRegistrations, e.hostName, e.status]
    );
  }
  console.log(`  ✅ ${events.length} events created`);

  // ── 5. Challenges ─────────────────────────────────────────────────
  console.log('🏆 Creating challenges...');
  await conn.execute(`DELETE FROM user_challenges`);
  await conn.execute(`DELETE FROM challenges`);

  const challengesData = [
    { name: '30-Day French Immersion', nameFr: 'Immersion française de 30 jours', description: 'Commit to 30 days of daily French practice. Post at least one comment or entry in French every day for 30 consecutive days.', descriptionFr: 'Engagez-vous à 30 jours de pratique quotidienne du français.', type: 'streak', targetCount: 30, pointsReward: 500, period: 'one_time' },
    { name: 'Community Contributor', nameFr: 'Contributeur communautaire', description: 'Create 5 original posts in the community forum this week. Share your knowledge, ask questions, or start discussions.', descriptionFr: 'Créez 5 publications originales dans le forum communautaire cette semaine.', type: 'posts', targetCount: 5, pointsReward: 100, period: 'weekly' },
    { name: 'Helpful Corrector', nameFr: 'Correcteur utile', description: 'Provide corrections on 10 notebook entries this month. Help your fellow learners improve their writing!', descriptionFr: 'Fournissez des corrections sur 10 entrées de carnet ce mois-ci.', type: 'corrections', targetCount: 10, pointsReward: 200, period: 'monthly' },
    { name: 'Event Enthusiast', nameFr: 'Passionné d\'événements', description: 'Attend 3 community events this month. Learning is better together!', descriptionFr: 'Participez à 3 événements communautaires ce mois-ci.', type: 'events', targetCount: 3, pointsReward: 150, period: 'monthly' },
    { name: 'Course Champion', nameFr: 'Champion des cours', description: 'Complete all lessons in any one course. Earn your certificate and show your dedication!', descriptionFr: 'Complétez toutes les leçons d\'un cours. Obtenez votre certificat!', type: 'courses', targetCount: 1, pointsReward: 300, period: 'one_time' },
    { name: 'Daily Engagement', nameFr: 'Engagement quotidien', description: 'Like or comment on 3 posts today. Stay active and support your community!', descriptionFr: 'Aimez ou commentez 3 publications aujourd\'hui.', type: 'comments', targetCount: 3, pointsReward: 25, period: 'daily' },
  ];

  for (const ch of challengesData) {
    await conn.execute(
      `INSERT INTO challenges (name, nameFr, description, descriptionFr, type, targetCount, pointsReward, period, isActive, startAt, endAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY))`,
      [ch.name, ch.nameFr, ch.description, ch.descriptionFr, ch.type, ch.targetCount, ch.pointsReward, ch.period]
    );
  }
  console.log(`  ✅ ${challengesData.length} challenges created`);

  // ── 6. Notebook Entries ───────────────────────────────────────────
  console.log('📓 Creating notebook entries...');
  await conn.execute(`DELETE FROM notebook_corrections`);
  await conn.execute(`DELETE FROM notebook_entries`);

  const notebookData = [
    { title: 'Mon premier jour au bureau', content: 'Aujourd\'hui, c\'était mon premier jour dans mon nouveau poste au gouvernement fédéral. J\'étais très nerveux parce que je savais que la plupart de mes collègues parlent français entre eux. Quand je suis arrivé, ma superviseure m\'a accueilli chaleureusement et m\'a présenté à l\'équipe. J\'ai essayé de me présenter en français, mais j\'ai fait beaucoup d\'erreurs. Tout le monde était très patient et encourageant. Je suis déterminé à améliorer mon français pour pouvoir participer aux réunions d\'équipe avec confiance.', language: 'french', status: 'corrected', correctionCount: 2 },
    { title: 'La réunion de comité', content: 'Hier, j\'ai assisté à ma première réunion de comité bilingue. Le président a commencé en anglais, puis a passé au français. J\'ai compris la plupart de ce qu\'il a dit, mais quand il m\'a demandé mon opinion, j\'ai figé. J\'ai finalement répondu en mélangeant les deux langues. Après la réunion, un collègue m\'a dit que c\'est normal et que ça va s\'améliorer avec la pratique. Il m\'a suggéré de pratiquer avec le cercle de conversation de RusingAcademy.', language: 'french', status: 'pending', correctionCount: 0 },
    { title: 'My experience with the SLE exam', content: 'Last week, I took my SLE oral exam for the second time. The first time, I was so nervous that I could barely speak. This time, I felt more prepared thanks to the mock exams I did with RusingAcademy. The evaluator asked me about my work experience and my opinion on remote work policies. I managed to structure my answers using the STAR method that Coach Steven taught us. I\'m waiting for my results, but I feel much more confident this time.', language: 'english', status: 'pending', correctionCount: 0 },
    { title: 'Les défis du télétravail bilingue', content: 'Le télétravail a changé la façon dont nous communiquons au bureau. Avant la pandémie, je pouvais pratiquer mon français naturellement avec mes collègues dans le corridor ou à la cafétéria. Maintenant, toutes les conversations sont planifiées — des réunions Teams, des courriels, des messages instantanés. C\'est plus difficile de pratiquer de manière informelle. J\'ai commencé à participer aux événements virtuels de la communauté RusingAcademy pour compenser ce manque de pratique quotidienne.', language: 'french', status: 'corrected', correctionCount: 3 },
  ];

  for (const nb of notebookData) {
    await conn.execute(
      `INSERT INTO notebook_entries (authorId, title, content, language, status, correctionCount, createdAt) VALUES (1, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*14) DAY))`,
      [nb.title, nb.content, nb.language, nb.status, nb.correctionCount]
    );
  }
  console.log(`  ✅ ${notebookData.length} notebook entries created`);

  // ── 7. Gamification: Leaderboard seed data ────────────────────────
  console.log('🎮 Creating leaderboard data...');
  await conn.execute(`DELETE FROM learner_badges`);
  await conn.execute(`DELETE FROM xp_transactions`);
  await conn.execute(`DELETE FROM learner_xp`);

  // Create the owner's XP entry
  await conn.execute(
    `INSERT INTO learner_xp (userId, totalXp, weeklyXp, monthlyXp, currentLevel, levelTitle, currentStreak, longestStreak) VALUES (1, 2450, 320, 890, 8, 'Expert', 14, 21)`
  );
  console.log(`  ✅ Leaderboard data created`);

  // ── Done ──────────────────────────────────────────────────────────
  console.log('\n🎉 Database seeding complete!');
  console.log('   - 6 forum categories');
  console.log(`   - ${threads.length} forum threads`);
  console.log(`   - ${coursesData.length} courses with modules & lessons`);
  console.log(`   - ${events.length} community events`);
  console.log(`   - ${challengesData.length} challenges`);
  console.log(`   - ${notebookData.length} notebook entries`);
  console.log('   - Leaderboard XP data');

  await conn.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
