import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const publicDir = path.resolve(import.meta.dirname, "../client/public");

describe("PWA — Manifest", () => {
  it("manifest.json exists in client/public", () => {
    expect(fs.existsSync(path.join(publicDir, "manifest.json"))).toBe(true);
  });

  it("manifest.json is valid JSON", () => {
    const raw = fs.readFileSync(path.join(publicDir, "manifest.json"), "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it("manifest has required PWA fields", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(publicDir, "manifest.json"), "utf-8")
    );
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.scope).toBe("/");
  });

  it("manifest theme_color matches ecosystem branding (#0D7377)", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(publicDir, "manifest.json"), "utf-8")
    );
    expect(manifest.theme_color).toBe("#0D7377");
  });

  it("manifest has at least 4 icons (192, 512, maskable variants)", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(publicDir, "manifest.json"), "utf-8")
    );
    expect(manifest.icons.length).toBeGreaterThanOrEqual(4);

    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    const purposes = manifest.icons.map((i: any) => i.purpose);
    expect(purposes).toContain("maskable");
    expect(purposes).toContain("any");
  });

  it("manifest has shortcuts defined", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(publicDir, "manifest.json"), "utf-8")
    );
    expect(manifest.shortcuts).toBeDefined();
    expect(manifest.shortcuts.length).toBeGreaterThan(0);
  });
});

describe("PWA — Icons", () => {
  const requiredIcons = [
    "icons/icon-192x192.png",
    "icons/icon-512x512.png",
    "icons/icon-maskable-192x192.png",
    "icons/icon-maskable-512x512.png",
    "icons/apple-touch-icon.png",
    "icons/favicon-32x32.png",
    "icons/favicon-16x16.png",
  ];

  requiredIcons.forEach((icon) => {
    it(`${icon} exists`, () => {
      expect(fs.existsSync(path.join(publicDir, icon))).toBe(true);
    });
  });

  it("icon-512x512.png is a valid PNG", () => {
    const buf = fs.readFileSync(path.join(publicDir, "icons/icon-512x512.png"));
    // PNG magic bytes: 137 80 78 71
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });
});

describe("PWA — index.html Meta Tags", () => {
  const indexHtml = fs.readFileSync(
    path.resolve(import.meta.dirname, "../client/index.html"),
    "utf-8"
  );

  it("has manifest link", () => {
    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('href="/manifest.json"');
  });

  it("has theme-color meta", () => {
    expect(indexHtml).toContain('name="theme-color"');
    expect(indexHtml).toContain('content="#0D7377"');
  });

  it("has apple-touch-icon", () => {
    expect(indexHtml).toContain('rel="apple-touch-icon"');
  });

  it("has apple-mobile-web-app-capable", () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-capable"');
    expect(indexHtml).toContain('content="yes"');
  });

  it("has apple-mobile-web-app-status-bar-style", () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-status-bar-style"');
  });

  it("has apple-mobile-web-app-title", () => {
    expect(indexHtml).toContain('name="apple-mobile-web-app-title"');
  });

  it("has Open Graph meta tags", () => {
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:description"');
  });
});

describe("PWA — Service Worker", () => {
  it("sw.js exists in client/public", () => {
    expect(fs.existsSync(path.join(publicDir, "sw.js"))).toBe(true);
  });

  it("sw.js contains install event listener", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("addEventListener('install'");
  });

  it("sw.js contains activate event listener", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("addEventListener('activate'");
  });

  it("sw.js contains fetch event listener", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("addEventListener('fetch'");
  });

  it("sw.js excludes API routes from caching (network-only)", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("\\/api\\/");
    expect(sw).toContain("NETWORK_ONLY_PATTERNS");
  });

  it("sw.js excludes OAuth routes from caching", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("/oauth");
  });

  it("sw.js excludes admin routes from caching", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("/admin");
  });

  it("sw.js uses skipWaiting for immediate activation", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("skipWaiting");
  });

  it("sw.js uses clients.claim for immediate control", () => {
    const sw = fs.readFileSync(path.join(publicDir, "sw.js"), "utf-8");
    expect(sw).toContain("clients.claim");
  });
});

describe("PWA — SW Registration in main.tsx", () => {
  const mainTsx = fs.readFileSync(
    path.resolve(import.meta.dirname, "../client/src/main.tsx"),
    "utf-8"
  );

  it("registers service worker", () => {
    expect(mainTsx).toContain("serviceWorker");
    expect(mainTsx).toContain("register('/sw.js'");
  });

  it("checks for serviceWorker support before registering", () => {
    expect(mainTsx).toContain("'serviceWorker' in navigator");
  });
});
