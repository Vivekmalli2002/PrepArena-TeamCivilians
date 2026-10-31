import type { Metadata } from "next";
import { MistakesScreen } from "./MistakesScreen";

export const metadata: Metadata = { title: "Mistake notebook" };

export default function Page() {
  return <MistakesScreen />;
}
