import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UnauthorizedError } from "@/lib/errors";
import { login } from "@/server/auth/auth.service";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/client";

const email = `it-login-${Date.now()}@alma.test`;
const password = "correct-horse-battery";

beforeAll(async () => {
  await prisma.user.create({
    data: {
      email,
      name: "Login Test",
      passwordHash: await hashPassword(password),
      role: "ATTORNEY",
    },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email } });
  await prisma.$disconnect();
});

describe("auth login (integration)", () => {
  it("returns the user for correct credentials", async () => {
    const user = await login(email, password);
    expect(user.email).toBe(email);
  });

  it("rejects a wrong password", async () => {
    await expect(login(email, "wrong")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });

  it("rejects an unknown email", async () => {
    await expect(login("nobody@alma.test", password)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});
