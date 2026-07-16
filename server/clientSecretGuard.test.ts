import { describe, expect, it } from "vitest";
import {
  scanClientArtifacts,
  scanText,
} from "../scripts/check-client-secrets.mjs";

describe("client secret guard", () => {
  it("detects provider credentials without printing their values", () => {
    expect(scanText(`const key = "${"AI" + "za" + "X".repeat(24)}"`)).toContain(
      "google-api-key"
    );
  });

  it("keeps direct provider configuration out of client source and bundles", () => {
    expect(scanClientArtifacts()).toEqual([]);
  });
});
