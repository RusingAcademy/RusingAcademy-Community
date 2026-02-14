import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { aiCorrections } from "../../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { invokeLLM } from "../_core/llm";

export const aiAssistantRouter = router({
  // Correct writing (AI-powered)
  correctWriting: protectedProcedure.input(z.object({
    text: z.string().min(1).max(5000),
    language: z.enum(["en", "fr"]).default("fr"),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    try {
      const systemPrompt = input.language === "fr"
        ? `You are a professional French language tutor specializing in Canadian French for public service employees. Analyze the text for grammar, spelling, style, and clarity. Return a JSON object with:
- correctedText: the fully corrected version
- corrections: array of { original, corrected, type (grammar|spelling|style|punctuation), explanation, explanationFr }
- grammarScore: 0-100
- styleScore: 0-100
- overallScore: 0-100
- detectedLevel: CEFR level (A1-C2)
- feedback: brief English feedback
- feedbackFr: brief French feedback`
        : `You are a professional English language tutor. Analyze the text for grammar, spelling, style, and clarity. Return a JSON object with:
- correctedText: the fully corrected version
- corrections: array of { original, corrected, type (grammar|spelling|style|punctuation), explanation }
- grammarScore: 0-100
- styleScore: 0-100
- overallScore: 0-100
- detectedLevel: CEFR level (A1-C2)
- feedback: brief feedback
- feedbackFr: brief French feedback`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input.text },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "writing_correction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correctedText: { type: "string" },
                corrections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original: { type: "string" },
                      corrected: { type: "string" },
                      type: { type: "string" },
                      explanation: { type: "string" },
                      explanationFr: { type: "string" },
                    },
                    required: ["original", "corrected", "type", "explanation", "explanationFr"],
                    additionalProperties: false,
                  },
                },
                grammarScore: { type: "integer" },
                styleScore: { type: "integer" },
                overallScore: { type: "integer" },
                detectedLevel: { type: "string" },
                feedback: { type: "string" },
                feedbackFr: { type: "string" },
              },
              required: ["correctedText", "corrections", "grammarScore", "styleScore", "overallScore", "detectedLevel", "feedback", "feedbackFr"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

      const result = JSON.parse(content);

      // Save to database
      await db.insert(aiCorrections).values({
        userId: ctx.user.id,
        originalText: input.text,
        correctedText: result.correctedText,
        language: input.language,
        detectedLevel: result.detectedLevel as any,
        corrections: result.corrections,
        grammarScore: result.grammarScore,
        styleScore: result.styleScore,
        overallScore: result.overallScore,
        feedback: result.feedback,
        feedbackFr: result.feedbackFr,
      });

      return result;
    } catch (error) {
      console.error("AI correction error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI correction failed. Please try again." });
    }
  }),

  // My correction history
  myHistory: protectedProcedure.input(z.object({
    limit: z.number().min(1).max(50).default(20),
  }).optional()).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(aiCorrections)
      .where(eq(aiCorrections.userId, ctx.user.id))
      .orderBy(desc(aiCorrections.createdAt))
      .limit(input?.limit ?? 20);
  }),

  // My progress stats
  myProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalCorrections: 0, avgGrammarScore: 0, avgStyleScore: 0, avgOverallScore: 0, currentLevel: "A1" };

    const [stats] = await db.select({
      totalCorrections: sql<number>`COUNT(*)`,
      avgGrammarScore: sql<number>`COALESCE(AVG(${aiCorrections.grammarScore}), 0)`,
      avgStyleScore: sql<number>`COALESCE(AVG(${aiCorrections.styleScore}), 0)`,
      avgOverallScore: sql<number>`COALESCE(AVG(${aiCorrections.overallScore}), 0)`,
    }).from(aiCorrections)
      .where(eq(aiCorrections.userId, ctx.user.id));

    // Get most recent level
    const [latest] = await db.select({ level: aiCorrections.detectedLevel })
      .from(aiCorrections)
      .where(eq(aiCorrections.userId, ctx.user.id))
      .orderBy(desc(aiCorrections.createdAt))
      .limit(1);

    return {
      totalCorrections: stats?.totalCorrections ?? 0,
      avgGrammarScore: Math.round(stats?.avgGrammarScore ?? 0),
      avgStyleScore: Math.round(stats?.avgStyleScore ?? 0),
      avgOverallScore: Math.round(stats?.avgOverallScore ?? 0),
      currentLevel: latest?.level ?? "A1",
    };
  }),

  // AI-powered content recommendation
  recommendContent: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { recommendations: [] };

    // Get user's recent corrections to understand their level
    const recentCorrections = await db.select().from(aiCorrections)
      .where(eq(aiCorrections.userId, ctx.user.id))
      .orderBy(desc(aiCorrections.createdAt))
      .limit(5);

    if (recentCorrections.length === 0) {
      return {
        recommendations: [
          { type: "course", title: "Start with a writing exercise", description: "Submit your first text to get personalized recommendations" },
        ],
      };
    }

    const avgScore = recentCorrections.reduce((sum, c) => sum + (c.overallScore ?? 0), 0) / recentCorrections.length;
    const commonErrors = recentCorrections.flatMap(c => (c.corrections as any[])?.map(corr => corr.type) ?? []);
    const errorCounts: Record<string, number> = {};
    commonErrors.forEach(e => { errorCounts[e] = (errorCounts[e] || 0) + 1; });

    const topWeakness = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "grammar";

    const recommendations = [];
    if (avgScore < 50) {
      recommendations.push({ type: "course", title: "Fundamentals Review", description: `Focus on ${topWeakness} basics to build a strong foundation` });
    } else if (avgScore < 75) {
      recommendations.push({ type: "challenge", title: "Daily Writing Challenge", description: `Practice ${topWeakness} with daily exercises` });
    } else {
      recommendations.push({ type: "advanced", title: "Advanced Style Workshop", description: "Refine your writing style for professional contexts" });
    }

    return { recommendations };
  }),
});
