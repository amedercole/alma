"use client";

import { useDemo } from "@/components/demo/demo-context";
import { DemoStartScreen } from "@/components/demo/demo-start-screen";

/**
 * Gates the whole app behind the demo start screen. Because the demo identity
 * lives in memory, a refresh re-shows the start screen.
 */
export function DemoGate({ children }: { children: React.ReactNode }) {
  const { email } = useDemo();
  if (!email) return <DemoStartScreen />;
  return <>{children}</>;
}
