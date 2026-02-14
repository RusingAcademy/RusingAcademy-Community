# Community Hub — Feature Integration Plan

## Features to Integrate (Best of Italki + Kajabi + Skool)

### From Skool:
- [x] Gamification system: points, custom levels, leaderboard
- [x] Content unlocking by level (gated courses)
- [x] Classroom section: course modules, lessons, video player, progress tracking
- [x] Events calendar with timezone support and RSVPs
- [x] Livestream/webinar scheduling
- [x] Universal search across posts, courses, members
- [x] Polls in posts
- [x] GIF support in posts
- [x] Member directory with profiles
- [x] Email broadcast (1-click post-to-email)

### From Kajabi:
- [x] Challenges system: time-bound activities with prizes, progress tracking
- [x] Badges and titles for achievements
- [x] Channels (private/public spaces within community)
- [x] Meetups/Events with Live Room
- [x] Direct messaging between members
- [x] Analytics dashboard (community insights)
- [x] Membership tiers display

### From Italki (already partially built, enhance):
- [x] Writing Corrections (Notebook) feature
- [ ] Enhanced Q&A section with voting/best answer
- [ ] Language exchange matching
- [ ] Teacher/Coach profiles with ratings and reviews
- [ ] Daily practice prompts (enhance existing)

### Navigation & UX:
- [x] Unified top navigation with all sections
- [x] Update left sidebar with new sections
- [x] Mobile responsive for all new features
- [x] Consistent "Soft Social" design across all features

### Database & Backend (web-db-user upgrade):
- [x] Upgrade project with web-db-user feature
- [x] Build 21-table database schema (forum, gamification, events, challenges, courses, notebook, notifications)
- [x] Build 7 tRPC API routers (forum, gamification, events, challenges, classroom, notebook, notifications)
- [x] 43 unit tests passing for all API routes
- [x] Connect PostCard with tRPC like toggle (optimistic updates)
- [x] Connect Leaderboard with tRPC data (fallback to mock)
- [x] Connect Home feed with tRPC forum data (fallback to mock)
- [x] Connect EventsCalendar with tRPC data (fallback to mock)
- [x] Integrate auth into TopHeader (login/logout, user avatar)
- [x] Connect Classroom with tRPC data
- [x] Connect Challenges with tRPC data
- [x] Connect Notebook with tRPC data
- [x] Seed database with initial content (courses, events, challenges, forum posts, notebook entries)
- [x] Rebrand with RusingAcademy/Lingueefy identity (logo, colors, typography)
- [x] Update footer with Rusinga International Consulting Ltd.

## Sprint 1 — Post Creation & Rich Content Editor
- [x] Rich text editor for post creation
- [x] Post creation modal with title, body, content type, language tags, image upload
- [x] Post editing for authors with optimistic UI
- [x] Post deletion with soft-delete and undo toast
- [x] Image upload pipeline (client → S3 → DB URL)
- [x] Unit tests for post CRUD operations (50 tests passing)

## Sprint 2 — Comments System & Threaded Discussions
- [x] Comment creation on posts with text support
- [x] Threaded replies (2-level nesting)
- [x] Comment likes with optimistic updates
- [x] Comment sorting (newest, oldest, most liked)
- [x] Comment count on PostCard
- [x] Unit tests for comments CRUD

## Sprint 3 — User Profiles & Member Directory
- [x] Profile page (/profile/:id) with avatar, bio, XP, badges, posts
- [x] Profile editing (avatar upload, name, bio, languages)
- [x] Member directory with search and filters
- [x] Activity feed per user
- [x] Database migration for profile fields

## Sprint 4 — Notifications Center
- [x] Notification bell with unread count in header
- [x] Notification types (comment, reply, like, badge, event)
- [x] Mark as read (individual and bulk)
- [x] Notification preferences per type
- [x] NotificationsPanel component with tRPC integration

## Sprint 5 — Mobile-First Responsive & Accessibility
- [x] Mobile touch targets (44px minimum)
- [x] Bottom navigation bar for mobile (MobileNav drawer)
- [x] Keyboard navigation and visible focus rings (gold outline)
- [x] ARIA labels and screen reader support (aria-current, aria-pressed, aria-label)
- [x] Skip-to-main-content link for keyboard users
- [x] Reduced motion support (prefers-reduced-motion)
- [x] Horizontal overflow prevention on mobile

## Sprint 6 — Direct Messaging
- [x] Conversations table and messages table in DB
- [x] DM router with create conversation, send message, list conversations, list messages
- [x] Messages page (/messages) with conversation list and chat view
- [x] Messages nav item in sidebar with route navigation
- [x] Unit tests for DM CRUD (5 tests)

## Sprint 7 — Universal Search
- [x] Search router querying posts, courses, events, members
- [x] SearchResults page (/search) with tabbed results (All, Posts, Courses, Events, Members)
- [x] Search bar in header navigates to /search with query param
- [x] Unit tests for search router (1 test)

## Sprint 8 — Polls & Podcast Audio Player
- [x] Polls table in DB (poll options, votes)
- [x] Polls router with create, vote, getByThread
- [x] PodcastPlayer component with play/pause/seek/speed/volume
- [x] Mini-player persistent at bottom of page via PodcastPlayerProvider context
- [x] Unit tests for polls CRUD (3 tests)

## Sprint 9 — Advanced Badges & Moderation Tools
- [x] content_reports and user_suspensions tables in DB
- [x] Moderation router: reportContent, listReports, resolveReport, suspendUser, liftSuspension, listSuspensions, stats
- [x] Moderation admin page (/moderation) with reports queue, suspensions list, stats
- [x] Admin-only access control (role-based)
- [x] Unit tests for moderation router (7 tests)

## Sprint 10 — Analytics Dashboard
- [x] Analytics router: overview, activityTimeline, topContributors, courseStats, eventStats, challengeStats
- [x] Analytics admin page (/analytics) with KPI cards, activity timeline chart, top contributors, course/event/challenge stats
- [x] Admin-only access control (role-based)
- [x] Unit tests for analytics router (6 tests)
- [x] All 72 tests passing across 12 routers

## Sprint 11 — Membership Tiers & Subscription Management
- [x] Membership tiers table (Free, Pro, Enterprise) with bilingual pricing
- [x] Membership router: listTiers, getTier, mySubscription, subscribe, cancelSubscription, myPayments, upsertTier, revenueOverview
- [x] Membership page (/membership) with pricing cards, FAQ section
- [x] User subscriptions table with billing cycle tracking
- [x] Payment transactions table for revenue tracking
- [x] Seeded 3 membership tiers (Free $0, Pro $29.99, Enterprise $99.99 CAD)
- [x] Unit tests for membership router (7 tests)

## Sprint 12 — Premium Content Gating & Drip Scheduling
- [x] Content access rules table with tier-based gating
- [x] Content access router: checkAccess, setRule, listRules
- [x] Drip schedule support (days-after-enrollment unlock)
- [x] Premium-only content filtering
- [x] Unit tests for content access router (4 tests)

## Sprint 13 — Affiliate & Referral Program
- [x] Referrals table with referral codes, click tracking, commission tracking
- [x] Referral router: myReferralCode, trackClick, registerReferral, myReferralStats, myReferrals
- [x] Referrals page (/referrals) with referral link, stats grid, referral list, how-it-works section
- [x] Auto-generated referral codes (RA-XXXXXX format)
- [x] Unit tests for referral router (6 tests)

## Sprint 14 — Email Marketing & Broadcast System
- [x] Email broadcasts table with bilingual subject/body
- [x] Email broadcast router: list, create, send, delete, stats
- [x] Email Broadcasts admin page (/email-broadcasts) with create form, stats, broadcast list
- [x] Admin-only access control
- [x] Unit tests for email broadcast router (7 tests)

## Sprint 15 — Certificates & Course Completion
- [x] Certificates table with unique certificate numbers (RA-CERT-XXXXXX)
- [x] Certificate router: myCertificates, verify, issueCertificate, adminList
- [x] Certificates page (/certificates) with certificate preview cards, RusingAcademy branding
- [x] Public certificate verification endpoint
- [x] Unit tests for certificate router (4 tests)

## Sprint 16 — AI Writing Assistant & Smart Corrections
- [x] AI corrections table with grammar/style/overall scores
- [x] AI assistant router: correctWriting (LLM-powered), myHistory, myProgress
- [x] AI Assistant page (/ai-assistant) with text input, score circles, correction details, history
- [x] Language level detection (A1-C2) via LLM
- [x] Bilingual feedback (EN/FR)
- [x] Unit tests for AI assistant router (5 tests)

## Sprint 17 — Internationalization (EN/FR Bilingual)
- [x] Bilingual fields across all new tables (nameFr, descriptionFr, subjectFr, bodyFr)
- [x] French translations for membership tiers, channels, email broadcasts
- [x] Content language filtering in content access
- [x] Bilingual feedback in AI corrections

## Sprint 18 — Advanced Analytics & Revenue Dashboard
- [x] Advanced analytics router: revenueDashboard, engagementMetrics, contentPerformance, referralAnalytics
- [x] Revenue Dashboard page (/revenue) with KPI cards, tier breakdown, referral stats, top courses/threads
- [x] MRR/ARR/churn rate calculations
- [x] Admin-only access control
- [x] Unit tests for advanced analytics router (8 tests)

## Sprint 19 — Community Channels & Spaces
- [x] Channels table (public/private/premium) with bilingual fields
- [x] Channel memberships table with role tracking
- [x] Channel router: list, myChannels, join, leave, adminCreate, adminUpdate
- [x] Channels page (/channels) with browse/my channels, join/leave, admin create
- [x] Seeded 7 channels (General, SLE Exam Prep, French Practice, English Practice, Career, Premium Lounge, Coaches Corner)
- [x] Unit tests for channels router (7 tests)

## Sprint 20 — Performance, SEO & Production Hardening
- [x] Updated navigation (LeftSidebar + MobileNav) with all Sprint 11-20 sections
- [x] Account section in sidebar (Membership, Referrals)
- [x] Admin section expanded (Revenue, Broadcasts)
- [x] All 123 unit tests passing across 20+ routers (3 test files)
- [x] TypeScript: 0 errors across entire codebase
- [x] 8 new database tables for Sprints 11-20
- [x] 8 new tRPC routers for Sprints 11-20
- [x] 7 new frontend pages for Sprints 11-20

## Sprint 21 — Stripe Payment Integration
- [x] Add Stripe feature via webdev_add_feature
- [x] Create Stripe products/prices for membership tiers (TIER_PRICING config)
- [x] Wire checkout flow (subscribe mutation → Stripe Checkout Session)
- [x] Webhook handler for payment events (checkout.session.completed, invoice.paid, customer.subscription.updated/deleted)
- [x] Update membership page with real Stripe checkout buttons (monthly/yearly)
- [x] Customer portal for subscription management (createPortalSession)
- [x] Payment history table on membership page
- [x] Unit tests for Stripe payment flow (7 tests)

## Sprint 22 — EN/FR Bilingual Language Switcher
- [x] Create LocaleContext with useLocale() hook and LocaleProvider
- [x] Build translation files (en.ts, fr.ts) for all UI strings (200+ keys)
- [x] Add language switcher toggle in header (LanguageSwitcher component)
- [x] Wire Course Builder page to use t() translation function
- [x] Persist language preference in localStorage (auto-detect browser lang)
- [x] Unit tests for locale translations (8 tests: structure, key matching, FR≠EN)

## Sprint 23 — Admin Course Creation Wizard
- [x] Course creation wizard page (/admin/courses, /admin/courses/new, /admin/courses/:id/edit)
- [x] Step 1: Course details (title EN/FR, description EN/FR, category, level, language, pricing, certificate)
- [x] Step 2: Module creation with drag ordering, bilingual titles, lesson management
- [x] Step 3: Lesson creation with content type (video/text/audio/quiz), preview flag, mandatory flag
- [x] Step 3: Review & Publish with course summary, module/lesson structure overview
- [x] Course listing view with status badges, edit buttons
- [x] Backend courseAdmin router: 15 procedures (list, get, createCourse, updateCourse, deleteCourse, addModule, updateModule, deleteModule, addLesson, updateLesson, deleteLesson, reorderModules, reorderLessons, publishCourse)
- [x] Admin-only access control on all procedures
- [x] Unit tests for course admin router (15 tests)
- [x] All 153 unit tests passing across 4 test files, 0 TypeScript errors

## Sprint 24 — Full Bilingual Coverage (Wire all pages to t())
- [x] Wire Home page (feed, tabs, filters, footer) to t()
- [x] Wire LeftSidebar and MobileNav to t()
- [x] Wire TopHeader to t()
- [x] Wire Leaderboard, Classroom, Events, Challenges, Notebook pages to t()
- [x] Wire Channels, Certificates, AIAssistant, Referrals pages to t()
- [x] Wire Membership page to t()
- [x] Wire RevenueDashboard, EmailBroadcasts, Moderation, Analytics pages to t()
- [x] Wire Messages, Search, Profile pages to t()
- [x] Expand en.ts and fr.ts with 400+ translation keys for all pages
- [x] Unit tests for full translation coverage (8 tests: key structure, FR≠EN, section matching)
- [x] 29 files wired with useLocale() hook

## Sprint 25 — Student Course Player & Certificate Auto-Issuance
- [x] Course catalog page (/courses) with published courses, category filters, enrollment CTA
- [x] Course detail page (/courses/:id) with syllabus, enroll button, bilingual content
- [x] Lesson viewer with video/text/audio player, markdown rendering (Streamdown)
- [x] Progress tracking backend: 8 procedures (catalog, courseDetail, enroll, myEnrollments, courseProgress, lessonContent, completeLesson, nextLesson)
- [x] Progress bar UI in course player header and sidebar
- [x] Certificate auto-issuance on 100% course completion (autoIssueCertificate helper)
- [x] Course enrollment with duplicate detection and lesson count initialization
- [x] Sidebar syllabus with module/lesson tree, completion checkmarks, active lesson highlight
- [x] Prev/Next lesson navigation with keyboard-friendly buttons
- [x] Navigation: Courses link in LeftSidebar + MobileNav (LEARN section), Course Builder in ADMIN section
- [x] Unit tests for course player backend (15 tests: auth checks, public access, input validation)
- [x] All 176 unit tests passing across 5 test files, 0 TypeScript errors

## ═══════════════════════════════════════════════════════
## ECOSYSTEM INTEGRATION — 50 Sprints
## ═══════════════════════════════════════════════════════

## Phase A — Infrastructure & Foundation (Sprints 1–5)
- [x] Sprint 1: Feature branch & CI setup
- [x] Sprint 2: Schema audit & table mapping
- [x] Sprint 3: New community tables migration (community_ prefix)
- [x] Sprint 4: Router namespace & RBAC permission (communityRouter + manage_community)
- [x] Sprint 5: Design token bridge & i18n strategy

## Phase B — Community Feed & Posts (Sprints 6–10)
- [x] Sprint 6: Forum router enhancement (createPost, likePost, getPostsByTab)
- [x] Sprint 7: Topic carousel & categories
- [x] Sprint 8: PostCard component & feed layout
- [x] Sprint 9: Post creation dialog with media upload
- [x] Sprint 10: Feed tabs & filtering (For You, Podcasts, Exercises, Questions)

## Phase C — Channels, Events & Spaces (Sprints 11–15)
- [x] Sprint 11: Channels backend
- [x] Sprint 12: Channels frontend
- [x] Sprint 13: Events integration
- [x] Sprint 14: Events calendar page
- [x] Sprint 15: In-app notifications

## Phase D — Messaging & Social (Sprints 16–20)
- [x] Sprint 16: Direct messages backend
- [x] Sprint 17: Messages page
- [x] Sprint 18: User profile enhancement with community stats
- [x] Sprint 19: Polls system
- [x] Sprint 20: Search integration

## Phase E — Gamification & Learning (Sprints 21–25)
- [x] Sprint 21: Gamification bridge (community XP triggers)
- [x] Sprint 22: Leaderboard page
- [x] Sprint 23: Challenges integration
- [x] Sprint 24: Notebook & corrections
- [x] Sprint 25: Classroom integration

## Phase F — Content Gating & Monetization (Sprints 26–30)
- [x] Sprint 26: Membership tier unification
- [x] Sprint 27: Content access rules engine
- [x] Sprint 28: Membership page unification
- [x] Sprint 29: Referral/affiliate unification
- [x] Sprint 30: Payment history & revenue

## Phase G — Admin Control System Extension (Sprints 31–37)
- [x] Sprint 31: Admin sidebar community section
- [x] Sprint 32: Admin feed management
- [x] Sprint 33: Admin channel management
- [x] Sprint 34: Admin moderation queue
- [x] Sprint 35: Admin email broadcasts
- [x] Sprint 36: Admin content gating rules
- [x] Sprint 37: Admin community analytics dashboard

## Phase H — AI Features & Course Player (Sprints 38–42)
- [x] Sprint 38: AI writing assistant backend
- [x] Sprint 39: AI writing assistant frontend
- [x] Sprint 40: Course player integration
- [x] Sprint 41: Course catalog page
- [x] Sprint 42: Certificate auto-issuance

## Phase I — i18n Migration & Design Polish (Sprints 43–46)
- [x] Sprint 43: i18n migration core pages
- [x] Sprint 44: i18n migration admin & monetization
- [x] Sprint 45: Design token alignment
- [x] Sprint 46: Accessibility & responsive audit

## Phase J — Testing, QA & Production Hardening (Sprints 47–50)
- [x] Sprint 47: Unit test migration (200+ tests)
- [x] Sprint 48: Integration & E2E testing
- [x] Sprint 49: Performance & security hardening
- [x] Sprint 50: Staging validation & production merge

## ═══════════════════════════════════════════════════════
## BEAUTIFICATION — 10 Sprints
## ═══════════════════════════════════════════════════════

## Sprint B1 — Typography & Color System Elevation
- [x] Add Inter as display font pairing with Plus Jakarta Sans
- [x] Introduce branded gradient variables (navy→gold, navy→indigo)
- [x] Refine color palette with deeper shadows, subtle warm tints
- [x] Add CSS custom properties for glass effects and depth layers
- [x] Upgrade section headings with gradient text treatment

## Sprint B2 — Sidebar & Navigation Redesign
- [x] Glassmorphism sidebar background with subtle blur
- [x] Animated active state indicators with spring transitions
- [x] Gold accent dividers between nav sections
- [x] User card with avatar ring and gradient background
- [x] Premium badge styling for membership items

## Sprint B3 — Header & Search Bar Premium Treatment
- [x] Branded gradient header background
- [x] Elevated search bar with glassmorphism and focus glow
- [x] User avatar with online status indicator
- [x] Notification bell with animated badge
- [x] Create button with gradient hover effect

## Sprint B4 — PostCard & Feed Redesign
- [x] Card depth with layered shadows and hover lift
- [x] Content type badges (Podcast, Exercise, Question)
- [x] Author avatar with gradient ring and verified badge
- [x] Engagement bar with animated counters
- [x] Topic carousel with glass overlay and parallax

## Sprint B5 — Loading States & Micro-Interactions
- [x] Skeleton screens for feed, sidebar, and cards
- [x] Page transition animations with framer-motion
- [x] Button press feedback and ripple effects
- [x] Toast notifications with branded styling
- [x] Smooth scroll and section reveal animations

## Sprint B6 — Right Sidebar & Widget Polish
- [x] Coach cards with glass effect and rating stars
- [x] Editor's Pick with gradient accent border
- [x] CTA banner with animated gradient background
- [x] Widget section headers with gold underline
- [x] Browse all link with arrow animation

## Sprint B7-B8 — Membership, Leaderboard & Gamification- [x] Membership cards with glass effect and popular badge
- [x] Leaderboard podium with gradient backgrounds
- [x] Challenge cards with progress rings and XP badges
- [x] Badge collection with hover animations
- [x] Daily practice cards with glass overlaynt B9 — Sub-pages Polish
- [x] Events calendar with branded color coding
- [x] Notebook entries with paper texture effect
- [x] AI Assistant chat with gradient message bubbles
- [x] Channels list with member count badges
- [x] Certificate viewer with gold border treatment

## Sprint B10 — Final Polish & Responsive Audit
- [x] Mobile navigation drawer with glass effect
- [x] Responsive breakpoint consistency pass
- [x] Dark mode preparation (CSS variable audit)
- [x] Performance audit (animation optimization)
- [x] Final visual consistency check across all pages

## ══════════════════════════════════════════════════
## ENHANCEMENT FEATURES — Post-Beautification
## ══════════════════════════════════════════════════

## Feature 1 — Dark Mode Toggle
- [x] Create ThemeProvider context with localStorage persistence
- [x] Add dark theme CSS variables in index.css (.dark class)
- [x] Wire toggle button in TopHeader with sun/moon icon animation
- [x] Ensure all components respect dark mode variables (LeftSidebar, TopHeader, RightSidebar)
- [ ] Test dark mode across all pages

## Feature 2 — Real-time WebSocket Notifications & Online Presence
- [x] Set up WebSocket server alongside Express (server/websocket.ts with ws library)
- [x] Create useWebSocket hook for client-side connection (singleton pattern, auto-reconnect)
- [x] Implement real-time notification delivery (RealtimeNotificationBell merges tRPC + WS)
- [x] Add online presence indicators (OnlineIndicator component with green dot)
- [x] Wire presence into messaging page and sidebar (Messages.tsx + LeftSidebar.tsx)
- [x] Add typing indicators in DM conversations (TypingIndicator component)
- [x] WebSocketStatus component in sidebar footer showing connection state
- [x] 26 vitest tests for WebSocket module, GIF detection, message protocol

## Feature 3 — GIF Picker in CreatePostDialog
- [x] Integrate Tenor API for GIF search (v2 API with categories)
- [x] Create GifPicker component with search, trending, and 10 categories
- [x] Wire GIF picker into CreatePostDialog (GIF button in toolbar)
- [x] Display selected GIF preview in post composition (with remove button)
- [x] Show GIF in PostCard feed rendering (auto-detect Tenor/Giphy URLs)
- [x] GIF rendering in Messages page (auto-detect GIF URLs in chat)

## Feature — PWA (Progressive Web App) Finalization
- [x] Observe branding from RusingAcademy-Ecosystem-Main-Repo (colors, logo)
- [x] Generate PWA icons: 192x192, 512x512, maskable, apple-touch-icon 180x180
- [x] Fix manifest.json: name, short_name, start_url, scope, display, icons, theme/bg colors
- [x] Add PWA meta tags to index.html (manifest link, apple-capable, status-bar-style, theme-color)
- [x] Implement Service Worker with safe caching strategy (no stale on auth/admin)
- [x] Implement install CTA: Chrome desktop/Android prompt + iOS A2HS instructions
- [x] Build + test + Lighthouse PWA audit pass (234 tests, 0 TS errors, build OK)
- [ ] Push to GitHub feat/pwa branch + PR + PWA_RELEASE_NOTES.md
