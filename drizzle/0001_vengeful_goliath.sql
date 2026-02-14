CREATE TABLE `challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameFr` varchar(100),
	`description` text,
	`descriptionFr` text,
	`type` enum('posts','comments','streak','events','courses','corrections') NOT NULL,
	`targetCount` int NOT NULL,
	`pointsReward` int NOT NULL,
	`period` enum('daily','weekly','monthly','one_time') NOT NULL,
	`startAt` timestamp,
	`endAt` timestamp,
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `community_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleFr` varchar(255),
	`description` text NOT NULL,
	`descriptionFr` text,
	`slug` varchar(300) NOT NULL,
	`eventType` enum('workshop','networking','practice','info_session','webinar','livestream','other') DEFAULT 'workshop',
	`startAt` timestamp NOT NULL,
	`endAt` timestamp NOT NULL,
	`timezone` varchar(50) DEFAULT 'America/Toronto',
	`locationType` enum('virtual','in_person','hybrid') DEFAULT 'virtual',
	`locationDetails` varchar(255),
	`meetingUrl` text,
	`maxCapacity` int,
	`currentRegistrations` int DEFAULT 0,
	`waitlistEnabled` boolean DEFAULT false,
	`price` int DEFAULT 0,
	`hostId` int,
	`hostName` varchar(100),
	`status` enum('draft','published','cancelled','completed') DEFAULT 'draft',
	`imageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `community_events_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `course_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`progressPercent` int DEFAULT 0,
	`lessonsCompleted` int DEFAULT 0,
	`totalLessons` int DEFAULT 0,
	`lastAccessedAt` timestamp,
	`completedAt` timestamp,
	`status` enum('active','completed','expired') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_enrollments_id` PRIMARY KEY(`id`),
	CONSTRAINT `enrollment_user_course_idx` UNIQUE(`userId`,`courseId`)
);
--> statement-breakpoint
CREATE TABLE `course_modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleFr` varchar(200),
	`description` text,
	`sortOrder` int DEFAULT 0,
	`totalLessons` int DEFAULT 0,
	`totalDurationMinutes` int DEFAULT 0,
	`isPreview` boolean DEFAULT false,
	`thumbnailUrl` text,
	`status` enum('draft','published','archived') DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `course_modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleFr` varchar(200),
	`slug` varchar(200) NOT NULL,
	`description` text,
	`descriptionFr` text,
	`shortDescription` varchar(500),
	`thumbnailUrl` text,
	`previewVideoUrl` text,
	`category` enum('sle_oral','sle_written','sle_reading','sle_complete','business_french','business_english','exam_prep','conversation','grammar','vocabulary') DEFAULT 'sle_oral',
	`level` enum('beginner','intermediate','advanced','all_levels') DEFAULT 'all_levels',
	`targetLanguage` enum('french','english','both') DEFAULT 'french',
	`price` int DEFAULT 0,
	`accessType` enum('one_time','subscription','free') DEFAULT 'free',
	`totalModules` int DEFAULT 0,
	`totalLessons` int DEFAULT 0,
	`totalDurationMinutes` int DEFAULT 0,
	`totalEnrollments` int DEFAULT 0,
	`averageRating` decimal(3,2),
	`totalReviews` int DEFAULT 0,
	`instructorId` int,
	`instructorName` varchar(100),
	`status` enum('draft','published','archived') DEFAULT 'draft',
	`publishedAt` timestamp,
	`hasCertificate` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `event_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('registered','waitlisted','cancelled','attended','no_show') DEFAULT 'registered',
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`cancelledAt` timestamp,
	`attendedAt` timestamp,
	`email` varchar(320),
	`name` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `event_registrations_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_reg_user_event_idx` UNIQUE(`userId`,`eventId`)
);
--> statement-breakpoint
CREATE TABLE `forum_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameFr` varchar(100),
	`description` text,
	`descriptionFr` text,
	`slug` varchar(100) NOT NULL,
	`icon` varchar(50),
	`color` varchar(20),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`threadCount` int DEFAULT 0,
	`postCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `forum_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `forum_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`parentId` int,
	`isEdited` boolean DEFAULT false,
	`editedAt` timestamp,
	`likeCount` int DEFAULT 0,
	`status` enum('active','hidden','deleted') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forum_threads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(300) NOT NULL,
	`content` text NOT NULL,
	`contentType` enum('article','podcast','exercise','question') DEFAULT 'article',
	`thumbnailUrl` text,
	`isPinned` boolean DEFAULT false,
	`isLocked` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`replyCount` int DEFAULT 0,
	`likeCount` int DEFAULT 0,
	`lastReplyAt` timestamp,
	`lastReplyById` int,
	`audioUrl` text,
	`audioDurationSeconds` int,
	`exerciseType` varchar(50),
	`difficulty` enum('beginner','intermediate','advanced'),
	`status` enum('active','hidden','deleted') DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `forum_threads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('like','comment','correction','challenge','event','badge','system') NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleFr` varchar(200),
	`message` text NOT NULL,
	`messageFr` text,
	`linkType` varchar(50),
	`linkId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`badgeType` enum('first_post','first_comment','streak_3','streak_7','streak_14','streak_30','streak_100','xp_100','xp_500','xp_1000','xp_5000','challenge_complete','event_attendee','top_contributor','helpful_corrector','community_helper','founding_member','course_complete') NOT NULL,
	`title` varchar(100) NOT NULL,
	`titleFr` varchar(100),
	`description` varchar(255),
	`descriptionFr` varchar(255),
	`iconUrl` varchar(500),
	`metadata` json,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	`isNew` boolean DEFAULT true,
	CONSTRAINT `learner_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learner_xp` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`weeklyXp` int NOT NULL DEFAULT 0,
	`monthlyXp` int NOT NULL DEFAULT 0,
	`currentLevel` int NOT NULL DEFAULT 1,
	`levelTitle` varchar(50) NOT NULL DEFAULT 'Beginner',
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastActivityDate` timestamp,
	`streakFreezeAvailable` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learner_xp_id` PRIMARY KEY(`id`),
	CONSTRAINT `learner_xp_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lessonId` int NOT NULL,
	`userId` int NOT NULL,
	`courseId` int,
	`moduleId` int,
	`status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
	`progressPercent` int DEFAULT 0,
	`timeSpentSeconds` int DEFAULT 0,
	`completedAt` timestamp,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`),
	CONSTRAINT `lesson_progress_user_lesson_idx` UNIQUE(`userId`,`lessonId`)
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`titleFr` varchar(200),
	`description` text,
	`contentType` enum('video','text','audio','pdf','quiz','assignment') DEFAULT 'video',
	`videoUrl` text,
	`videoDurationSeconds` int,
	`textContent` text,
	`audioUrl` text,
	`sortOrder` int DEFAULT 0,
	`estimatedMinutes` int DEFAULT 10,
	`isPreview` boolean DEFAULT false,
	`isMandatory` boolean DEFAULT true,
	`status` enum('draft','published','archived') DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notebook_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryId` int NOT NULL,
	`correctorId` int NOT NULL,
	`correctedContent` text NOT NULL,
	`explanation` text,
	`isAccepted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notebook_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notebook_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`language` enum('french','english') NOT NULL,
	`status` enum('pending','corrected','archived') DEFAULT 'pending',
	`correctionCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notebook_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `post_likes_user_post_idx` UNIQUE(`userId`,`postId`)
);
--> statement-breakpoint
CREATE TABLE `thread_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `thread_likes_id` PRIMARY KEY(`id`),
	CONSTRAINT `thread_likes_user_thread_idx` UNIQUE(`userId`,`threadId`)
);
--> statement-breakpoint
CREATE TABLE `user_challenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`currentProgress` int NOT NULL DEFAULT 0,
	`targetProgress` int NOT NULL,
	`status` enum('active','completed','expired') NOT NULL DEFAULT 'active',
	`periodStart` timestamp,
	`periodEnd` timestamp,
	`completedAt` timestamp,
	`pointsAwarded` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `xp_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`reason` enum('post_created','comment_added','like_received','challenge_complete','event_attended','streak_bonus','daily_login','course_progress','notebook_entry','correction_given','milestone_bonus','level_up_bonus') NOT NULL,
	`description` varchar(255),
	`referenceType` varchar(50),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','coach','learner') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` enum('en','fr') DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `community_events` ADD CONSTRAINT `community_events_hostId_users_id_fk` FOREIGN KEY (`hostId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_enrollments` ADD CONSTRAINT `course_enrollments_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `course_modules` ADD CONSTRAINT `course_modules_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `courses` ADD CONSTRAINT `courses_instructorId_users_id_fk` FOREIGN KEY (`instructorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_eventId_community_events_id_fk` FOREIGN KEY (`eventId`) REFERENCES `community_events`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_threadId_forum_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `forum_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_posts` ADD CONSTRAINT `forum_posts_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_threads` ADD CONSTRAINT `forum_threads_categoryId_forum_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `forum_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_threads` ADD CONSTRAINT `forum_threads_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forum_threads` ADD CONSTRAINT `forum_threads_lastReplyById_users_id_fk` FOREIGN KEY (`lastReplyById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `in_app_notifications` ADD CONSTRAINT `in_app_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_badges` ADD CONSTRAINT `learner_badges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `learner_xp` ADD CONSTRAINT `learner_xp_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_lessonId_lessons_id_fk` FOREIGN KEY (`lessonId`) REFERENCES `lessons`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_moduleId_course_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_moduleId_course_modules_id_fk` FOREIGN KEY (`moduleId`) REFERENCES `course_modules`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notebook_corrections` ADD CONSTRAINT `notebook_corrections_entryId_notebook_entries_id_fk` FOREIGN KEY (`entryId`) REFERENCES `notebook_entries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notebook_corrections` ADD CONSTRAINT `notebook_corrections_correctorId_users_id_fk` FOREIGN KEY (`correctorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notebook_entries` ADD CONSTRAINT `notebook_entries_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_postId_forum_posts_id_fk` FOREIGN KEY (`postId`) REFERENCES `forum_posts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post_likes` ADD CONSTRAINT `post_likes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `thread_likes` ADD CONSTRAINT `thread_likes_threadId_forum_threads_id_fk` FOREIGN KEY (`threadId`) REFERENCES `forum_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `thread_likes` ADD CONSTRAINT `thread_likes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_challenges` ADD CONSTRAINT `user_challenges_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_challenges` ADD CONSTRAINT `user_challenges_challengeId_challenges_id_fk` FOREIGN KEY (`challengeId`) REFERENCES `challenges`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `xp_transactions` ADD CONSTRAINT `xp_transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;