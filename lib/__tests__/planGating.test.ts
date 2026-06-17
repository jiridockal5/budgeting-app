import { describe, it, expect, vi } from "vitest";

// planGating imports lib/prisma, which throws without a DB URL.
// These tests only exercise the pure functions, so stub the module.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  computeAccessState,
  getTrialEndDate,
  getUserAccessInfo,
  canExport,
  hasFreeAccessEmail,
  PAST_DUE_GRACE_DAYS,
} from "@/lib/planGating";
import { BILLING_GATE_ENABLED, TRIAL_DAYS } from "@/config/plans";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

describe("computeAccessState", () => {
  it("returns paid for an ACTIVE subscription within the period", () => {
    expect(
      computeAccessState({
        growthTrialEndsAt: null,
        subscription: { status: "ACTIVE", currentPeriodEnd: daysFromNow(10) },
      })
    ).toBe("paid");
  });

  it("returns paid for a TRIALING subscription within the period", () => {
    expect(
      computeAccessState({
        growthTrialEndsAt: null,
        subscription: { status: "TRIALING", currentPeriodEnd: daysFromNow(3) },
      })
    ).toBe("paid");
  });

  it("locks an ACTIVE subscription whose period has lapsed and no trial", () => {
    expect(
      computeAccessState({
        growthTrialEndsAt: null,
        subscription: { status: "ACTIVE", currentPeriodEnd: daysFromNow(-1) },
      })
    ).toBe("locked");
  });

  it("returns trial when no subscription and trial has not ended", () => {
    expect(
      computeAccessState({
        growthTrialEndsAt: daysFromNow(2),
        subscription: null,
      })
    ).toBe("trial");
  });

  it("returns locked when no subscription and trial has ended", () => {
    expect(
      computeAccessState({
        growthTrialEndsAt: daysFromNow(-1),
        subscription: null,
      })
    ).toBe("locked");
  });

  it("returns locked for a CANCELLED subscription with expired trial", () => {
    expect(
      computeAccessState({
        growthTrialEndsAt: daysFromNow(-30),
        subscription: {
          status: "CANCELLED",
          currentPeriodEnd: daysFromNow(10),
        },
      })
    ).toBe("locked");
  });

  describe("PAST_DUE grace period", () => {
    it("keeps access during the grace window after the period end", () => {
      expect(
        computeAccessState({
          growthTrialEndsAt: daysFromNow(-60),
          subscription: {
            status: "PAST_DUE",
            currentPeriodEnd: daysFromNow(-(PAST_DUE_GRACE_DAYS - 1)),
          },
        })
      ).toBe("paid");
    });

    it("locks once the grace window has fully elapsed", () => {
      expect(
        computeAccessState({
          growthTrialEndsAt: daysFromNow(-60),
          subscription: {
            status: "PAST_DUE",
            currentPeriodEnd: daysFromNow(-(PAST_DUE_GRACE_DAYS + 1)),
          },
        })
      ).toBe("locked");
    });
  });
});

describe("getTrialEndDate", () => {
  it("returns a date TRIAL_DAYS in the future", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const end = getTrialEndDate(from);
    expect(end.getTime() - from.getTime()).toBe(TRIAL_DAYS * DAY_MS);
  });
});

describe("hasFreeAccessEmail", () => {
  it("returns true for emails listed in FREE_ACCESS_EMAILS", () => {
    process.env.FREE_ACCESS_EMAILS = "Owner@Example.com, other@test.com";
    expect(hasFreeAccessEmail("owner@example.com")).toBe(true);
    expect(hasFreeAccessEmail("other@test.com")).toBe(true);
  });

  it("returns false when email is not listed", () => {
    process.env.FREE_ACCESS_EMAILS = "owner@example.com";
    expect(hasFreeAccessEmail("stranger@example.com")).toBe(false);
    expect(hasFreeAccessEmail(null)).toBe(false);
  });
});

describe("canExport", () => {
  it("mirrors app access", () => {
    expect(canExport(true)).toBe(true);
    expect(canExport(false)).toBe(false);
  });
});

describe("getUserAccessInfo when BILLING_GATE_ENABLED is false", () => {
  it("grants full access without checking trial or subscription", async () => {
    expect(BILLING_GATE_ENABLED).toBe(false);

    const access = await getUserAccessInfo("user-with-expired-trial");

    expect(access).toMatchObject({
      state: "paid",
      hasAppAccess: true,
      isOnTrial: false,
      isPaid: true,
      trialDaysLeft: null,
    });
  });
});
