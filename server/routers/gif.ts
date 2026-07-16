import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "../_core/env";
import { protectedProcedure, router } from "../_core/trpc";

const TENOR_API_BASE = "https://tenor.googleapis.com/v2";
const DEFAULT_RATE_LIMIT = 30;
const DEFAULT_RATE_WINDOW_MS = 60_000;
const UPSTREAM_TIMEOUT_MS = 8_000;

const httpsUrl = z
  .string()
  .url()
  .refine(value => new URL(value).protocol === "https:", "HTTPS URL required");

const mediaVariantSchema = z.object({
  url: httpsUrl,
  dims: z.array(z.number().int().nonnegative()).length(2),
});

const tenorResponseSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        title: z.string().max(500).default(""),
        media_formats: z.object({
          gif: mediaVariantSchema.optional(),
          tinygif: mediaVariantSchema.optional(),
          mediumgif: mediaVariantSchema.optional(),
          nanogif: mediaVariantSchema.optional(),
        }),
      })
    )
    .max(20),
  next: z.string().max(512).default(""),
});

const gifSearchInput = z.object({
  query: z.string().trim().max(100).default(""),
  limit: z.number().int().min(1).max(20).default(20),
  pos: z.string().trim().min(1).max(200).optional(),
});

type GifRouterDependencies = {
  fetchImpl?: typeof fetch;
  getApiKey?: () => string;
  now?: () => number;
  maxRequests?: number;
  windowMs?: number;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

/**
 * Creates an authenticated GIF proxy router. The limiter is intentionally
 * per-process; it provides immediate abuse protection without adding a new
 * infrastructure dependency. A shared store can replace it if this service is
 * later scaled horizontally.
 */
export function createGifRouter(dependencies: GifRouterDependencies = {}) {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const getApiKey = dependencies.getApiKey ?? (() => ENV.tenorApiKey);
  const now = dependencies.now ?? Date.now;
  const maxRequests = dependencies.maxRequests ?? DEFAULT_RATE_LIMIT;
  const windowMs = dependencies.windowMs ?? DEFAULT_RATE_WINDOW_MS;
  const buckets = new Map<number, RateBucket>();

  function consumeRateLimit(userId: number) {
    const timestamp = now();
    const existing = buckets.get(userId);

    if (!existing || timestamp >= existing.resetAt) {
      buckets.set(userId, { count: 1, resetAt: timestamp + windowMs });
      return;
    }

    if (existing.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many GIF requests. Please wait and try again.",
      });
    }

    existing.count += 1;
  }

  return router({
    search: protectedProcedure
      .input(gifSearchInput)
      .mutation(async ({ ctx, input }) => {
        const apiKey = getApiKey().trim();
        if (!apiKey) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "GIF search is temporarily unavailable.",
          });
        }

        consumeRateLimit(ctx.user.id);

        const endpoint = input.query ? "search" : "featured";
        const params = new URLSearchParams({
          key: apiKey,
          client_key: "rusingacademy_community",
          limit: String(input.limit),
          media_filter: "gif,tinygif,mediumgif,nanogif",
          contentfilter: "medium",
        });
        if (input.query) params.set("q", input.query);
        if (input.pos) params.set("pos", input.pos);

        let response: Response;
        try {
          response = await fetchImpl(
            `${TENOR_API_BASE}/${endpoint}?${params}`,
            {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
            }
          );
        } catch {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "GIF service did not respond. Please try again.",
          });
        }

        if (!response.ok) {
          console.warn("Tenor proxy request failed", {
            status: response.status,
          });
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "GIF service is temporarily unavailable.",
          });
        }

        try {
          return tenorResponseSchema.parse(await response.json());
        } catch {
          throw new TRPCError({
            code: "BAD_GATEWAY",
            message: "GIF service returned an invalid response.",
          });
        }
      }),
  });
}

export const gifRouter = createGifRouter();
