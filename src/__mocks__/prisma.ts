import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import { beforeEach, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@prisma/prisma";

vi.mock("@prisma/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

export const prismaMock = prisma as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});
