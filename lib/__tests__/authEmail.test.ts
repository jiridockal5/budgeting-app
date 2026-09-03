import { describe, expect, it } from "vitest";
import {
  isEmailNotConfirmedError,
  isExistingSignupUser,
} from "@/lib/authEmail";

describe("isExistingSignupUser", () => {
  it("returns true when identities is empty", () => {
    expect(isExistingSignupUser({ identities: [] })).toBe(true);
  });

  it("returns false for a new signup identity", () => {
    expect(isExistingSignupUser({ identities: [{ id: "1" }] })).toBe(false);
  });

  it("returns false for null user", () => {
    expect(isExistingSignupUser(null)).toBe(false);
  });
});

describe("isEmailNotConfirmedError", () => {
  it("detects common Supabase messages", () => {
    expect(isEmailNotConfirmedError("Email not confirmed")).toBe(true);
    expect(isEmailNotConfirmedError("email_not_confirmed")).toBe(true);
    expect(isEmailNotConfirmedError("Please confirm your email")).toBe(true);
  });

  it("rejects unrelated errors", () => {
    expect(isEmailNotConfirmedError("Invalid login credentials")).toBe(false);
    expect(isEmailNotConfirmedError(null)).toBe(false);
  });
});
