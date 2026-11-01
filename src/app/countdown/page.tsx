import type { Metadata } from "next";
import { CountdownScreen } from "./CountdownScreen";

export const metadata: Metadata = { title: "Countdowns" };

export default function Page() {
  return <CountdownScreen />;
}
