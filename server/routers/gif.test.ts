import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "../_core/context";
import { createGifRouter } from "./gif";

function createContext(authenticated = true): TrpcContext {
  return {
    user: authenticated
      ? ({
          id: 42,
          openId: "gif-test-user",
          email: "gif-test@example.com",
          name: "GIF Test User",
          loginMethod: "test",
          role: "user",
          avatarUrl: null,
          preferredLanguage: "en",
          bio: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as NonNullable<TrpcContext["user"]>)
      : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function validUpstreamResponse() {
  return new Response(
    JSON.stringify({
      results: [
        {
          id: "gif-1",
          title: "Celebration",
          media_formats: {
            tinygif: {
              url: "https://media.tenor.com/example.gif",
              dims: [120, 80],
            },
          },
        },
      ],
      next: "next-page",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

describe("gif.search", () => {
  it("requires an authenticated user before contacting the provider", async () => {
    const fetchImpl = vi.fn(async () => validUpstreamResponse());
    const caller = createGifRouter({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getApiKey: () => "configured",
    }).createCaller(createContext(false));

    await expect(caller.search({ query: "hello" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps provider configuration server-side and returns validated media", async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(String(input));
      expect(url.origin).toBe("https://tenor.googleapis.com");
      expect(url.pathname).toBe("/v2/search");
      expect(url.searchParams.get("key")).toBe("configured");
      expect(url.searchParams.get("q")).toBe("celebrate");
      expect(url.searchParams.get("limit")).toBe("20");
      return validUpstreamResponse();
    });
    const caller = createGifRouter({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getApiKey: () => "configured",
    }).createCaller(createContext());

    const result = await caller.search({ query: "celebrate", limit: 20 });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].media_formats.tinygif?.url).toBe(
      "https://media.tenor.com/example.gif"
    );
    expect(JSON.stringify(result)).not.toContain("configured");
  });

  it("fails closed when the server-side provider key is absent", async () => {
    const fetchImpl = vi.fn(async () => validUpstreamResponse());
    const caller = createGifRouter({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getApiKey: () => "",
    }).createCaller(createContext());

    await expect(caller.search({ query: "" })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("enforces the per-user request limit", async () => {
    const caller = createGifRouter({
      fetchImpl: vi.fn(async () =>
        validUpstreamResponse()
      ) as unknown as typeof fetch,
      getApiKey: () => "configured",
      maxRequests: 2,
      windowMs: 60_000,
      now: () => 1_000,
    }).createCaller(createContext());

    await caller.search({ query: "one" });
    await caller.search({ query: "two" });
    await expect(caller.search({ query: "three" })).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
  });

  it("does not leak upstream error bodies", async () => {
    const caller = createGifRouter({
      fetchImpl: vi.fn(
        async () =>
          new Response("provider detail must stay private", { status: 403 })
      ) as unknown as typeof fetch,
      getApiKey: () => "configured",
    }).createCaller(createContext());

    await expect(caller.search({ query: "blocked" })).rejects.toMatchObject({
      code: "BAD_GATEWAY",
      message: "GIF service is temporarily unavailable.",
    });
  });
});
