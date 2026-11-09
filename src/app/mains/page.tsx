import type { Metadata } from "next";
import { MainsScreen } from "./MainsScreen";

export const metadata: Metadata = { title: "Group-I Mains checklist" };

export default function Page() {
  return <MainsScreen />;
}
