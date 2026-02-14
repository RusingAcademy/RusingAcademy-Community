import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean, uniqueIndex } from "drizzle-orm/mysql-core";

// ============================================================================
// USERS TABLE (Core — Extended from template)
// ============================================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "coach", "learner"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  preferredLanguage: mysqlEnum("preferredLanguage", ["en", "fr"]).default("en"),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// FORUM CATEGORIES
// ============================================================================
export const forumCategories = mysqlTable("forum_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameFr: varchar("nameFr", { length: 100 }),
  description: text("description"),
  descriptionFr: text("descriptionFr"),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  threadCount: int("threadCount").default(0),
  postCount: int("postCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumCategory = typeof forumCategories.$inferSelect;
export type InsertForumCategory = typeof forumCategories.$inferInsert;

// ============================================================================
// FORUM THREADS (Community Posts / Feed Items)
// ============================================================================
export const forumThreads = mysqlTable("forum_threads", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull().references(() => forumCategories.id),
  authorId: int("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 300 }).notNull(),
  content: text("content").notNull(),
  contentType: mysqlEnum("contentType", ["article", "podcast", "exercise", "question"]).default("article"),
  thumbnailUrl: text("thumbnailUrl"),
  isPinned: boolean("isPinned").default(false),
  isLocked: boolean("isLocked").default(false),
  viewCount: int("viewCount").default(0),
  replyCount: int("replyCount").default(0),
  likeCount: int("likeCount").default(0),
  lastReplyAt: timestamp("lastReplyAt"),
  lastReplyById: int("lastReplyById").references(() => users.id),
  // Podcast-specific fields
  audioUrl: text("audioUrl"),
  audioDurationSeconds: int("audioDurationSeconds"),
  // Exercise-specific fields
  exerciseType: varchar("exerciseType", { length: 50 }),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]),
  status: mysqlEnum("status", ["active", "hidden", "deleted"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumThread = typeof forumThreads.$inferSelect;
export type InsertForumThread = typeof forumThreads.$inferInsert;

// ============================================================================
// FORUM POSTS (Replies / Comments on threads)
// ============================================================================
export const forumPosts = mysqlTable("forum_posts", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull().references(() => forumThreads.id),
  authorId: int("authorId").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: int("parentId"), // For nested replies
  isEdited: boolean("isEdited").default(false),
  editedAt: timestamp("editedAt"),
  likeCount: int("likeCount").default(0),
  status: mysqlEnum("status", ["active", "hidden", "deleted"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = typeof forumPosts.$inferInsert;

// ============================================================================
// THREAD LIKES
// ============================================================================
export const threadLikes = mysqlTable("thread_likes", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull().references(() => forumThreads.id),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  uniqueIndex("thread_likes_user_thread_idx").on(table.userId, table.threadId),
]));

export type ThreadLike = typeof threadLikes.$inferSelect;
export type InsertThreadLike = typeof threadLikes.$inferInsert;

// ============================================================================
// POST LIKES
// ============================================================================
export const postLikes = mysqlTable("post_likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull().references(() => forumPosts.id),
  userId: int("userId").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  uniqueIndex("post_likes_user_post_idx").on(table.userId, table.postId),
]));

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;

// ============================================================================
// GAMIFICATION: LEARNER XP
// ============================================================================
export const learnerXp = mysqlTable("learner_xp", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id).unique(),
  totalXp: int("totalXp").default(0).notNull(),
  weeklyXp: int("weeklyXp").default(0).notNull(),
  monthlyXp: int("monthlyXp").default(0).notNull(),
  currentLevel: int("currentLevel").default(1).notNull(),
  levelTitle: varchar("levelTitle", { length: 50 }).default("Beginner").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: timestamp("lastActivityDate"),
  streakFreezeAvailable: boolean("streakFreezeAvailable").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearnerXp = typeof learnerXp.$inferSelect;
export type InsertLearnerXp = typeof learnerXp.$inferInsert;

// ============================================================================
// GAMIFICATION: XP TRANSACTIONS
// ============================================================================
export const xpTransactions = mysqlTable("xp_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  amount: int("amount").notNull(),
  reason: mysqlEnum("reason", [
    "post_created",
    "comment_added",
    "like_received",
    "challenge_complete",
    "event_attended",
    "streak_bonus",
    "daily_login",
    "course_progress",
    "notebook_entry",
    "correction_given",
    "milestone_bonus",
    "level_up_bonus",
  ]).notNull(),
  description: varchar("description", { length: 255 }),
  referenceType: varchar("referenceType", { length: 50 }),
  referenceId: int("referenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type XpTransaction = typeof xpTransactions.$inferSelect;
export type InsertXpTransaction = typeof xpTransactions.$inferInsert;

// ============================================================================
// GAMIFICATION: LEARNER BADGES
// ============================================================================
export const learnerBadges = mysqlTable("learner_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  badgeType: mysqlEnum("badgeType", [
    "first_post",
    "first_comment",
    "streak_3",
    "streak_7",
    "streak_14",
    "streak_30",
    "streak_100",
    "xp_100",
    "xp_500",
    "xp_1000",
    "xp_5000",
    "challenge_complete",
    "event_attendee",
    "top_contributor",
    "helpful_corrector",
    "community_helper",
    "founding_member",
    "course_complete",
  ]).notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  titleFr: varchar("titleFr", { length: 100 }),
  description: varchar("description", { length: 255 }),
  descriptionFr: varchar("descriptionFr", { length: 255 }),
  iconUrl: varchar("iconUrl", { length: 500 }),
  metadata: json("metadata"),
  awardedAt: timestamp("awardedAt").defaultNow().notNull(),
  isNew: boolean("isNew").default(true),
});

export type LearnerBadge = typeof learnerBadges.$inferSelect;
export type InsertLearnerBadge = typeof learnerBadges.$inferInsert;

// ============================================================================
// COMMUNITY EVENTS
// ============================================================================
export const communityEvents = mysqlTable("community_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  titleFr: varchar("titleFr", { length: 255 }),
  description: text("description").notNull(),
  descriptionFr: text("descriptionFr"),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  eventType: mysqlEnum("eventType", ["workshop", "networking", "practice", "info_session", "webinar", "livestream", "other"]).default("workshop"),
  startAt: timestamp("startAt").notNull(),
  endAt: timestamp("endAt").notNull(),
  timezone: varchar("timezone", { length: 50 }).default("America/Toronto"),
  locationType: mysqlEnum("locationType", ["virtual", "in_person", "hybrid"]).default("virtual"),
  locationDetails: varchar("locationDetails", { length: 255 }),
  meetingUrl: text("meetingUrl"),
  maxCapacity: int("maxCapacity"),
  currentRegistrations: int("currentRegistrations").default(0),
  waitlistEnabled: boolean("waitlistEnabled").default(false),
  price: int("price").default(0),
  hostId: int("hostId").references(() => users.id),
  hostName: varchar("hostName", { length: 100 }),
  status: mysqlEnum("status", ["draft", "published", "cancelled", "completed"]).default("draft"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunityEvent = typeof communityEvents.$inferSelect;
export type InsertCommunityEvent = typeof communityEvents.$inferInsert;

// ============================================================================
// EVENT REGISTRATIONS
// ============================================================================
export const eventRegistrations = mysqlTable("event_registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => communityEvents.id),
  userId: int("userId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["registered", "waitlisted", "cancelled", "attended", "no_show"]).default("registered"),
  registeredAt: timestamp("registeredAt").defaultNow().notNull(),
  cancelledAt: timestamp("cancelledAt"),
  attendedAt: timestamp("attendedAt"),
  email: varchar("email", { length: 320 }),
  name: varchar("name", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  uniqueIndex("event_reg_user_event_idx").on(table.userId, table.eventId),
]));

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertEventRegistration = typeof eventRegistrations.$inferInsert;

// ============================================================================
// CHALLENGES
// ============================================================================
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameFr: varchar("nameFr", { length: 100 }),
  description: text("description"),
  descriptionFr: text("descriptionFr"),
  type: mysqlEnum("type", ["posts", "comments", "streak", "events", "courses", "corrections"]).notNull(),
  targetCount: int("targetCount").notNull(),
  pointsReward: int("pointsReward").notNull(),
  period: mysqlEnum("period", ["daily", "weekly", "monthly", "one_time"]).notNull(),
  startAt: timestamp("startAt"),
  endAt: timestamp("endAt"),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

// ============================================================================
// USER CHALLENGE PROGRESS
// ============================================================================
export const userChallenges = mysqlTable("user_challenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  challengeId: int("challengeId").notNull().references(() => challenges.id),
  currentProgress: int("currentProgress").default(0).notNull(),
  targetProgress: int("targetProgress").notNull(),
  status: mysqlEnum("status", ["active", "completed", "expired"]).default("active").notNull(),
  periodStart: timestamp("periodStart"),
  periodEnd: timestamp("periodEnd"),
  completedAt: timestamp("completedAt"),
  pointsAwarded: int("pointsAwarded"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;

// ============================================================================
// COURSES (Classroom)
// ============================================================================
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  titleFr: varchar("titleFr", { length: 200 }),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  descriptionFr: text("descriptionFr"),
  shortDescription: varchar("shortDescription", { length: 500 }),
  thumbnailUrl: text("thumbnailUrl"),
  previewVideoUrl: text("previewVideoUrl"),
  category: mysqlEnum("category", [
    "sle_oral",
    "sle_written",
    "sle_reading",
    "sle_complete",
    "business_french",
    "business_english",
    "exam_prep",
    "conversation",
    "grammar",
    "vocabulary",
  ]).default("sle_oral"),
  level: mysqlEnum("level", ["beginner", "intermediate", "advanced", "all_levels"]).default("all_levels"),
  targetLanguage: mysqlEnum("targetLanguage", ["french", "english", "both"]).default("french"),
  price: int("price").default(0),
  accessType: mysqlEnum("accessType", ["one_time", "subscription", "free"]).default("free"),
  totalModules: int("totalModules").default(0),
  totalLessons: int("totalLessons").default(0),
  totalDurationMinutes: int("totalDurationMinutes").default(0),
  totalEnrollments: int("totalEnrollments").default(0),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  totalReviews: int("totalReviews").default(0),
  instructorId: int("instructorId").references(() => users.id),
  instructorName: varchar("instructorName", { length: 100 }),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft"),
  publishedAt: timestamp("publishedAt"),
  hasCertificate: boolean("hasCertificate").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ============================================================================
// COURSE MODULES
// ============================================================================
export const courseModules = mysqlTable("course_modules", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull().references(() => courses.id),
  title: varchar("title", { length: 200 }).notNull(),
  titleFr: varchar("titleFr", { length: 200 }),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  totalLessons: int("totalLessons").default(0),
  totalDurationMinutes: int("totalDurationMinutes").default(0),
  isPreview: boolean("isPreview").default(false),
  thumbnailUrl: text("thumbnailUrl"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("published"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = typeof courseModules.$inferInsert;

// ============================================================================
// LESSONS
// ============================================================================
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull().references(() => courseModules.id),
  courseId: int("courseId").notNull().references(() => courses.id),
  title: varchar("title", { length: 200 }).notNull(),
  titleFr: varchar("titleFr", { length: 200 }),
  description: text("description"),
  contentType: mysqlEnum("contentType", ["video", "text", "audio", "pdf", "quiz", "assignment"]).default("video"),
  videoUrl: text("videoUrl"),
  videoDurationSeconds: int("videoDurationSeconds"),
  textContent: text("textContent"),
  audioUrl: text("audioUrl"),
  sortOrder: int("sortOrder").default(0),
  estimatedMinutes: int("estimatedMinutes").default(10),
  isPreview: boolean("isPreview").default(false),
  isMandatory: boolean("isMandatory").default(true),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("published"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;

// ============================================================================
// COURSE ENROLLMENTS
// ============================================================================
export const courseEnrollments = mysqlTable("course_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  courseId: int("courseId").notNull().references(() => courses.id),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  progressPercent: int("progressPercent").default(0),
  lessonsCompleted: int("lessonsCompleted").default(0),
  totalLessons: int("totalLessons").default(0),
  lastAccessedAt: timestamp("lastAccessedAt"),
  completedAt: timestamp("completedAt"),
  status: mysqlEnum("status", ["active", "completed", "expired"]).default("active"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  uniqueIndex("enrollment_user_course_idx").on(table.userId, table.courseId),
]));

export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type InsertCourseEnrollment = typeof courseEnrollments.$inferInsert;

// ============================================================================
// LESSON PROGRESS
// ============================================================================
export const lessonProgress = mysqlTable("lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull().references(() => lessons.id),
  userId: int("userId").notNull().references(() => users.id),
  courseId: int("courseId").references(() => courses.id),
  moduleId: int("moduleId").references(() => courseModules.id),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started"),
  progressPercent: int("progressPercent").default(0),
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  completedAt: timestamp("completedAt"),
  lastAccessedAt: timestamp("lastAccessedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  uniqueIndex("lesson_progress_user_lesson_idx").on(table.userId, table.lessonId),
]));

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

// ============================================================================
// NOTEBOOK ENTRIES (Writing Corrections — Italki-inspired)
// ============================================================================
export const notebookEntries = mysqlTable("notebook_entries", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  language: mysqlEnum("language", ["french", "english"]).notNull(),
  status: mysqlEnum("status", ["pending", "corrected", "archived"]).default("pending"),
  correctionCount: int("correctionCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotebookEntry = typeof notebookEntries.$inferSelect;
export type InsertNotebookEntry = typeof notebookEntries.$inferInsert;

// ============================================================================
// NOTEBOOK CORRECTIONS
// ============================================================================
export const notebookCorrections = mysqlTable("notebook_corrections", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull().references(() => notebookEntries.id),
  correctorId: int("correctorId").notNull().references(() => users.id),
  correctedContent: text("correctedContent").notNull(),
  explanation: text("explanation"),
  isAccepted: boolean("isAccepted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotebookCorrection = typeof notebookCorrections.$inferSelect;
export type InsertNotebookCorrection = typeof notebookCorrections.$inferInsert;

// ============================================================================
// IN-APP NOTIFICATIONS
// ============================================================================
export const inAppNotifications = mysqlTable("in_app_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["like", "comment", "correction", "challenge", "event", "badge", "system"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  titleFr: varchar("titleFr", { length: 200 }),
  message: text("message").notNull(),
  messageFr: text("messageFr"),
  linkType: varchar("linkType", { length: 50 }),
  linkId: int("linkId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InAppNotification = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = typeof inAppNotifications.$inferInsert;

// ============================================================================
// CONVERSATIONS (Direct Messaging — Sprint 6)
// ============================================================================
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  participantOneId: int("participantOneId").notNull().references(() => users.id),
  participantTwoId: int("participantTwoId").notNull().references(() => users.id),
  lastMessageAt: timestamp("lastMessageAt"),
  lastMessagePreview: varchar("lastMessagePreview", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ([
  uniqueIndex("conv_participants_idx").on(table.participantOneId, table.participantTwoId),
]));

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ============================================================================
// MESSAGES (Direct Messages — Sprint 6)
// ============================================================================
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull().references(() => conversations.id),
  senderId: int("senderId").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  status: mysqlEnum("status", ["sent", "delivered", "read", "deleted"]).default("sent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ============================================================================
// POLLS (Sprint 8)
// ============================================================================
export const polls = mysqlTable("polls", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull().references(() => forumThreads.id),
  question: varchar("question", { length: 500 }).notNull(),
  options: json("options").notNull(), // Array of { id: string, text: string }
  allowMultiple: boolean("allowMultiple").default(false),
  endsAt: timestamp("endsAt"),
  totalVotes: int("totalVotes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;

// ============================================================================
// POLL VOTES (Sprint 8)
// ============================================================================
export const pollVotes = mysqlTable("poll_votes", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("pollId").notNull().references(() => polls.id),
  userId: int("userId").notNull().references(() => users.id),
  optionId: varchar("optionId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ([
  uniqueIndex("poll_vote_user_option_idx").on(table.userId, table.pollId, table.optionId),
]));

export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = typeof pollVotes.$inferInsert;

// ============================================================================
// CONTENT REPORTS (Moderation — Sprint 9)
// ============================================================================
export const contentReports = mysqlTable("content_reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterId: int("reporterId").notNull().references(() => users.id),
  contentType: mysqlEnum("contentType", ["thread", "comment", "message", "user"]).notNull(),
  contentId: int("contentId").notNull(),
  reason: mysqlEnum("reason", [
    "spam",
    "harassment",
    "hate_speech",
    "inappropriate",
    "misinformation",
    "copyright",
    "other",
  ]).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending"),
  reviewedById: int("reviewedById").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = typeof contentReports.$inferInsert;

// ============================================================================
// USER SUSPENSIONS (Moderation — Sprint 9)
// ============================================================================
export const userSuspensions = mysqlTable("user_suspensions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  suspendedById: int("suspendedById").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  suspendedAt: timestamp("suspendedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  liftedAt: timestamp("liftedAt"),
  liftedById: int("liftedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserSuspension = typeof userSuspensions.$inferSelect;
export type InsertUserSuspension = typeof userSuspensions.$inferInsert;

// ============================================================================
// MEMBERSHIP TIERS (Sprint 11)
// ============================================================================
export const membershipTiers = mysqlTable("membership_tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  nameFr: varchar("nameFr", { length: 50 }),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  descriptionFr: text("descriptionFr"),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).default("0.00"),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }).default("0.00"),
  currency: varchar("currency", { length: 3 }).default("CAD"),
  stripePriceIdMonthly: varchar("stripePriceIdMonthly", { length: 100 }),
  stripePriceIdYearly: varchar("stripePriceIdYearly", { length: 100 }),
  stripeProductId: varchar("stripeProductId", { length: 100 }),
  features: json("features"), // Array of feature strings
  featuresFr: json("featuresFr"),
  maxCourses: int("maxCourses").default(-1), // -1 = unlimited
  maxDMs: int("maxDMs").default(5),
  canAccessPremiumContent: boolean("canAccessPremiumContent").default(false),
  canCreateEvents: boolean("canCreateEvents").default(false),
  canAccessAnalytics: boolean("canAccessAnalytics").default(false),
  badgeLabel: varchar("badgeLabel", { length: 30 }),
  badgeColor: varchar("badgeColor", { length: 20 }),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipTier = typeof membershipTiers.$inferSelect;
export type InsertMembershipTier = typeof membershipTiers.$inferInsert;

// ============================================================================
// USER SUBSCRIPTIONS (Sprint 11)
// ============================================================================
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  tierId: int("tierId").notNull().references(() => membershipTiers.id),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  status: mysqlEnum("status", ["active", "past_due", "canceled", "trialing", "paused", "incomplete"]).default("active").notNull(),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "yearly"]).default("monthly"),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false),
  canceledAt: timestamp("canceledAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

// ============================================================================
// PAYMENT HISTORY (Sprint 11)
// ============================================================================
export const paymentHistory = mysqlTable("payment_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  subscriptionId: int("subscriptionId").references(() => userSubscriptions.id),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 100 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 100 }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CAD"),
  status: mysqlEnum("status", ["succeeded", "pending", "failed", "refunded"]).default("pending"),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentHistoryRow = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;

// ============================================================================
// CONTENT ACCESS RULES (Sprint 12 — Premium Gating)
// ============================================================================
export const contentAccessRules = mysqlTable("content_access_rules", {
  id: int("id").autoincrement().primaryKey(),
  contentType: mysqlEnum("contentType", ["course", "lesson", "event", "category", "challenge"]).notNull(),
  contentId: int("contentId").notNull(),
  requiredTierId: int("requiredTierId").references(() => membershipTiers.id),
  dripDelayDays: int("dripDelayDays").default(0), // Days after enrollment to unlock
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentAccessRule = typeof contentAccessRules.$inferSelect;
export type InsertContentAccessRule = typeof contentAccessRules.$inferInsert;

// ============================================================================
// REFERRALS (Sprint 13)
// ============================================================================
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull().references(() => users.id),
  referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
  referredUserId: int("referredUserId").references(() => users.id),
  status: mysqlEnum("status", ["pending", "signed_up", "converted", "expired"]).default("pending"),
  clickCount: int("clickCount").default(0),
  commissionAmount: decimal("commissionAmount", { precision: 10, scale: 2 }).default("0.00"),
  commissionPaid: boolean("commissionPaid").default(false),
  paidAt: timestamp("paidAt"),
  convertedAt: timestamp("convertedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ============================================================================
// EMAIL BROADCASTS (Sprint 14)
// ============================================================================
export const emailBroadcasts = mysqlTable("email_broadcasts", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull().references(() => users.id),
  subject: varchar("subject", { length: 255 }).notNull(),
  subjectFr: varchar("subjectFr", { length: 255 }),
  body: text("body").notNull(),
  bodyFr: text("bodyFr"),
  recipientFilter: json("recipientFilter"), // { tier?: string, role?: string, language?: string }
  recipientCount: int("recipientCount").default(0),
  sentCount: int("sentCount").default(0),
  openedCount: int("openedCount").default(0),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  sourceThreadId: int("sourceThreadId").references(() => forumThreads.id), // For post-to-email
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailBroadcast = typeof emailBroadcasts.$inferSelect;
export type InsertEmailBroadcast = typeof emailBroadcasts.$inferInsert;

// ============================================================================
// CERTIFICATES (Sprint 15)
// ============================================================================
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  courseId: int("courseId").notNull().references(() => courses.id),
  certificateNumber: varchar("certificateNumber", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  titleFr: varchar("titleFr", { length: 255 }),
  recipientName: varchar("recipientName", { length: 200 }).notNull(),
  completedAt: timestamp("completedAt").notNull(),
  certificateUrl: text("certificateUrl"),
  metadata: json("metadata"), // { grade, score, hours, etc. }
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});

export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

// ============================================================================
// AI CORRECTIONS (Sprint 16)
// ============================================================================
export const aiCorrections = mysqlTable("ai_corrections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  originalText: text("originalText").notNull(),
  correctedText: text("correctedText").notNull(),
  language: varchar("language", { length: 10 }).default("fr"),
  detectedLevel: mysqlEnum("detectedLevel", ["A1", "A2", "B1", "B2", "C1", "C2"]),
  corrections: json("corrections"), // Array of { original, corrected, type, explanation }
  grammarScore: int("grammarScore"), // 0-100
  styleScore: int("styleScore"), // 0-100
  overallScore: int("overallScore"), // 0-100
  feedback: text("feedback"),
  feedbackFr: text("feedbackFr"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiCorrection = typeof aiCorrections.$inferSelect;
export type InsertAiCorrection = typeof aiCorrections.$inferInsert;

// ============================================================================
// COMMUNITY CHANNELS (Sprint 19)
// ============================================================================
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  nameFr: varchar("nameFr", { length: 100 }),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  descriptionFr: text("descriptionFr"),
  iconUrl: text("iconUrl"),
  coverUrl: text("coverUrl"),
  visibility: mysqlEnum("visibility", ["public", "private", "premium"]).default("public"),
  requiredTierId: int("requiredTierId").references(() => membershipTiers.id),
  createdById: int("createdById").notNull().references(() => users.id),
  memberCount: int("memberCount").default(0),
  threadCount: int("threadCount").default(0),
  isActive: boolean("isActive").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

// ============================================================================
// CHANNEL MEMBERSHIPS (Sprint 19)
// ============================================================================
export const channelMemberships = mysqlTable("channel_memberships", {
  id: int("id").autoincrement().primaryKey(),
  channelId: int("channelId").notNull().references(() => channels.id),
  userId: int("userId").notNull().references(() => users.id),
  role: mysqlEnum("role", ["member", "moderator", "admin"]).default("member"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
}, (table) => ([
  uniqueIndex("channel_member_idx").on(table.channelId, table.userId),
]));

export type ChannelMembership = typeof channelMemberships.$inferSelect;
export type InsertChannelMembership = typeof channelMemberships.$inferInsert;
