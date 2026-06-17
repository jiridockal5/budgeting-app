import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindUnique, mockUpdate, mockCreate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
      create: mockCreate,
    },
  },
}));

vi.mock("@/lib/serverUser", () => ({
  getServerUser: vi.fn(),
}));

vi.mock("@/lib/planGating", () => ({
  getTrialEndDate: () => new Date("2026-07-01T00:00:00Z"),
}));

import { getServerUser } from "@/lib/serverUser";
import { resolveDbUser } from "@/lib/server/dbUser";

const authUser = {
  id: "supabase-user-id",
  email: "user@example.com",
  isFallback: false,
};

const dbUserByEmail = {
  id: "legacy-user-id",
  email: "user@example.com",
  name: "user",
  stripeCustomerId: null,
  growthTrialEndsAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("resolveDbUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerUser).mockResolvedValue(authUser);
  });

  it("returns the user when auth id matches", async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...dbUserByEmail,
      id: authUser.id,
    });

    const user = await resolveDbUser();

    expect(user.id).toBe(authUser.id);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("re-links a legacy email row to the current auth id", async () => {
    mockFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(dbUserByEmail);
    mockUpdate.mockResolvedValueOnce({
      ...dbUserByEmail,
      id: authUser.id,
    });

    const user = await resolveDbUser();

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "legacy-user-id" },
      data: { id: authUser.id },
    });
    expect(user.id).toBe(authUser.id);
  });

  it("creates a user when none exists", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValueOnce({
      ...dbUserByEmail,
      id: authUser.id,
    });

    const user = await resolveDbUser();

    expect(mockCreate).toHaveBeenCalled();
    expect(user.id).toBe(authUser.id);
  });
});
