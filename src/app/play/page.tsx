import type { Metadata } from "next";
import { Player } from "./Player";

export const metadata: Metadata = { title: "Test" };

export default function Page() {
  return <Player />;
}
