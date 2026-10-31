import type { Metadata } from "next";
import { MainsScreen } from "./MainsScreen";

export const metadata: Metadata = { title: "Mains answer writing" };

export default function Page() {
  return <MainsScreen />;
}
