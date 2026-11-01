import type { Metadata } from "next";
import { MistakesScreen } from "./MistakesScreen";

export const metadata: Metadata = { title: "Error log book" };

export default function Page() {
  return <MistakesScreen />;
}
