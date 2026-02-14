import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { forumRouter } from "./routers/forum";
import { gamificationRouter } from "./routers/gamification";
import { eventsRouter } from "./routers/events";
import { challengesRouter } from "./routers/challenges";
import { classroomRouter } from "./routers/classroom";
import { notebookRouter } from "./routers/notebook";
import { notificationsRouter } from "./routers/notifications";
import { dmRouter } from "./routers/dm";
import { searchRouter } from "./routers/search";
import { pollsRouter } from "./routers/polls";
import { moderationRouter } from "./routers/moderation";
import { analyticsRouter } from "./routers/analytics";

// Sprint 11-20 routers
import { membershipRouter } from "./routers/membership";
import { referralRouter } from "./routers/referral";
import { emailBroadcastRouter } from "./routers/emailBroadcast";
import { certificateRouter } from "./routers/certificate";
import { aiAssistantRouter } from "./routers/aiAssistant";
import { channelRouter } from "./routers/channel";
import { contentAccessRouter } from "./routers/contentAccess";
import { advancedAnalyticsRouter } from "./routers/advancedAnalytics";
import { courseAdminRouter } from "./routers/courseAdmin";
import { coursePlayerRouter } from "./routers/coursePlayer";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers (Sprint 1-5)
  forum: forumRouter,
  gamification: gamificationRouter,
  events: eventsRouter,
  challenges: challengesRouter,
  classroom: classroomRouter,
  notebook: notebookRouter,
  notifications: notificationsRouter,

  // Feature routers (Sprint 6-10)
  dm: dmRouter,
  search: searchRouter,
  polls: pollsRouter,
  moderation: moderationRouter,
  analytics: analyticsRouter,

  // Feature routers (Sprint 11-20)
  membership: membershipRouter,
  referral: referralRouter,
  emailBroadcast: emailBroadcastRouter,
  certificate: certificateRouter,
  aiAssistant: aiAssistantRouter,
  channel: channelRouter,
  contentAccess: contentAccessRouter,
  advancedAnalytics: advancedAnalyticsRouter,
  courseAdmin: courseAdminRouter,
  coursePlayer: coursePlayerRouter,
});

export type AppRouter = typeof appRouter;
