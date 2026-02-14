CREATE TABLE `ai_corrections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalText` text NOT NULL,
	`correctedText` text NOT NULL,
	`language` varchar(10) DEFAULT 'fr',
	`detectedLevel` enum('A1','A2','B1','B2','C1','C2'),
	`corrections` json,
	`grammarScore` int,
	`styleScore` int,
	`overallScore` int,
	`feedback` text,
	`feedbackFr` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_corrections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`certificateNumber` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`titleFr` varchar(255),
	`recipientName` varchar(200) NOT NULL,
	`completedAt` timestamp NOT NULL,
	`certificateUrl` text,
	`metadata` json,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateNumber_unique` UNIQUE(`certificateNumber`)
);
--> statement-breakpoint
CREATE TABLE `channel_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`channelId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('member','moderator','admin') DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `channel_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `channel_member_idx` UNIQUE(`channelId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`nameFr` varchar(100),
	`slug` varchar(100) NOT NULL,
	`description` text,
	`descriptionFr` text,
	`iconUrl` text,
	`coverUrl` text,
	`visibility` enum('public','private','premium') DEFAULT 'public',
	`requiredTierId` int,
	`createdById` int NOT NULL,
	`memberCount` int DEFAULT 0,
	`threadCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `content_access_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` enum('course','lesson','event','category','challenge') NOT NULL,
	`contentId` int NOT NULL,
	`requiredTierId` int,
	`dripDelayDays` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `content_access_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_broadcasts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`subjectFr` varchar(255),
	`body` text NOT NULL,
	`bodyFr` text,
	`recipientFilter` json,
	`recipientCount` int DEFAULT 0,
	`sentCount` int DEFAULT 0,
	`openedCount` int DEFAULT 0,
	`status` enum('draft','scheduled','sending','sent','failed') DEFAULT 'draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`sourceThreadId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership_tiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`nameFr` varchar(50),
	`slug` varchar(50) NOT NULL,
	`description` text,
	`descriptionFr` text,
	`priceMonthly` decimal(10,2) DEFAULT '0.00',
	`priceYearly` decimal(10,2) DEFAULT '0.00',
	`currency` varchar(3) DEFAULT 'CAD',
	`stripePriceIdMonthly` varchar(100),
	`stripePriceIdYearly` varchar(100),
	`stripeProductId` varchar(100),
	`features` json,
	`featuresFr` json,
	`maxCourses` int DEFAULT -1,
	`maxDMs` int DEFAULT 5,
	`canAccessPremiumContent` boolean DEFAULT false,
	`canCreateEvents` boolean DEFAULT false,
	`canAccessAnalytics` boolean DEFAULT false,
	`badgeLabel` varchar(30),
	`badgeColor` varchar(20),
	`sortOrder` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `membership_tiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `membership_tiers_name_unique` UNIQUE(`name`),
	CONSTRAINT `membership_tiers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `payment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int,
	`stripePaymentIntentId` varchar(100),
	`stripeInvoiceId` varchar(100),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'CAD',
	`status` enum('succeeded','pending','failed','refunded') DEFAULT 'pending',
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referralCode` varchar(20) NOT NULL,
	`referredUserId` int,
	`status` enum('pending','signed_up','converted','expired') DEFAULT 'pending',
	`clickCount` int DEFAULT 0,
	`commissionAmount` decimal(10,2) DEFAULT '0.00',
	`commissionPaid` boolean DEFAULT false,
	`paidAt` timestamp,
	`convertedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tierId` int NOT NULL,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`status` enum('active','past_due','canceled','trialing','paused','incomplete') NOT NULL DEFAULT 'active',
	`billingCycle` enum('monthly','yearly') DEFAULT 'monthly',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean DEFAULT false,
	`canceledAt` timestamp,
	`trialEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ai_corrections` ADD CONSTRAINT `ai_corrections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `certificates` ADD CONSTRAINT `certificates_courseId_courses_id_fk` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_memberships` ADD CONSTRAINT `channel_memberships_channelId_channels_id_fk` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channel_memberships` ADD CONSTRAINT `channel_memberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channels` ADD CONSTRAINT `channels_requiredTierId_membership_tiers_id_fk` FOREIGN KEY (`requiredTierId`) REFERENCES `membership_tiers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channels` ADD CONSTRAINT `channels_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `content_access_rules` ADD CONSTRAINT `content_access_rules_requiredTierId_membership_tiers_id_fk` FOREIGN KEY (`requiredTierId`) REFERENCES `membership_tiers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_broadcasts` ADD CONSTRAINT `email_broadcasts_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_broadcasts` ADD CONSTRAINT `email_broadcasts_sourceThreadId_forum_threads_id_fk` FOREIGN KEY (`sourceThreadId`) REFERENCES `forum_threads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_history` ADD CONSTRAINT `payment_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_history` ADD CONSTRAINT `payment_history_subscriptionId_user_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `user_subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerId_users_id_fk` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredUserId_users_id_fk` FOREIGN KEY (`referredUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_subscriptions` ADD CONSTRAINT `user_subscriptions_tierId_membership_tiers_id_fk` FOREIGN KEY (`tierId`) REFERENCES `membership_tiers`(`id`) ON DELETE no action ON UPDATE no action;