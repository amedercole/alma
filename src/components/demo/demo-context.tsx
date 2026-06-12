"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

interface DemoState {
  /** The email the visitor entered on the start screen, or null (gated). */
  email: string | null;
  /** Provision a demo session for `email` and reveal the app. */
  signIn: (email: string) => Promise<void>;
  /** Clear the in-memory email and end the session (back to the start screen). */
  reset: () => Promise<void>;
}

const DemoContext = createContext<DemoState | null>(null);

/**
 * Holds the demo identity in memory only — deliberately not persisted — so a
 * full page refresh clears it and returns the visitor to the start screen.
 */
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  const signIn = useCallback(
    async (nextEmail: string) => {
      const res = await fetch("/api/demo/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Could not start the demo");
      }
      setEmail(nextEmail);
      // Re-render server components so they pick up the new session cookie.
      router.refresh();
    },
    [router],
  );

  const reset = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setEmail(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ email, signIn, reset }),
    [email, signIn, reset],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within a DemoProvider");
  return ctx;
}
