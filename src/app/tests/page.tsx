import type { Metadata } from "next";
import { CatalogScreen } from "./CatalogScreen";

export const metadata: Metadata = { title: "Tests" };

export default function Page() {
  return <CatalogScreen />;
}
