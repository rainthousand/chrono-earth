import type { Metadata } from "next";
import { ChronoExperience } from "./ChronoExperience";

export const metadata: Metadata = {
  title: "Chrono Earth · 时光地球",
  description:
    "在一颗可以亲手转动的地球上，探索景点、年代与改变世界的历史事件。",
};

export default function Home() {
  return <ChronoExperience />;
}
