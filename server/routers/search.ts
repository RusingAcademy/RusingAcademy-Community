import { z } from "zod";
import { eq, and, or, desc, sql, like } from "drizzle-orm";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  forumThreads,
  users,
  courses,
  communityEvents,
} from "../../drizzle/schema";

export const searchRouter = router({
  // Universal search across all content types
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(200),
        type: z.enum(["all", "posts", "courses", "events", "members"]).default("all"),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { posts: [], courses: [], events: [], members: [], total: 0 };

      const q = `%${input.query}%`;
      const results: {
        posts: any[];
        courses: any[];
        events: any[];
        members: any[];
        total: number;
      } = { posts: [], courses: [], events: [], members: [], total: 0 };

      // Search posts
      if (input.type === "all" || input.type === "posts") {
        const posts = await db
          .select({
            id: forumThreads.id,
            title: forumThreads.title,
            content: forumThreads.content,
            contentType: forumThreads.contentType,
            likeCount: forumThreads.likeCount,
            replyCount: forumThreads.replyCount,
            createdAt: forumThreads.createdAt,
            authorId: forumThreads.authorId,
          })
          .from(forumThreads)
          .where(
            and(
              eq(forumThreads.status, "active"),
              or(
                like(forumThreads.title, q),
                like(forumThreads.content, q)
              )
            )
          )
          .orderBy(desc(forumThreads.createdAt))
          .limit(input.limit);

        // Enrich with author info
        results.posts = await Promise.all(
          posts.map(async (post) => {
            const [author] = await db
              .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
              .from(users)
              .where(eq(users.id, post.authorId))
              .limit(1);
            return {
              ...post,
              content: post.content.substring(0, 200),
              author: author || { id: post.authorId, name: "Unknown", avatarUrl: null },
            };
          })
        );
      }

      // Search courses
      if (input.type === "all" || input.type === "courses") {
        results.courses = await db
          .select({
            id: courses.id,
            title: courses.title,
            description: courses.description,
            shortDescription: courses.shortDescription,
            category: courses.category,
            level: courses.level,
            thumbnailUrl: courses.thumbnailUrl,
            totalEnrollments: courses.totalEnrollments,
            averageRating: courses.averageRating,
            instructorName: courses.instructorName,
          })
          .from(courses)
          .where(
            and(
              eq(courses.status, "published"),
              or(
                like(courses.title, q),
                like(courses.description, q),
                like(courses.shortDescription, q)
              )
            )
          )
          .orderBy(desc(courses.totalEnrollments))
          .limit(input.limit);
      }

      // Search events
      if (input.type === "all" || input.type === "events") {
        results.events = await db
          .select({
            id: communityEvents.id,
            title: communityEvents.title,
            description: communityEvents.description,
            eventType: communityEvents.eventType,
            startAt: communityEvents.startAt,
            endAt: communityEvents.endAt,
            imageUrl: communityEvents.imageUrl,
            hostName: communityEvents.hostName,
            currentRegistrations: communityEvents.currentRegistrations,
          })
          .from(communityEvents)
          .where(
            and(
              eq(communityEvents.status, "published"),
              or(
                like(communityEvents.title, q),
                like(communityEvents.description, q)
              )
            )
          )
          .orderBy(desc(communityEvents.startAt))
          .limit(input.limit);
      }

      // Search members
      if (input.type === "all" || input.type === "members") {
        results.members = await db
          .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            role: users.role,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(
            or(
              like(users.name, q),
              like(users.bio, q),
              like(users.email, q)
            )
          )
          .limit(input.limit);
      }

      results.total =
        results.posts.length +
        results.courses.length +
        results.events.length +
        results.members.length;

      return results;
    }),
});
