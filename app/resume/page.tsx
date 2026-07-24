import type { Metadata } from "next";
import ClassicResume from "@/components/resume/ClassicResume";
import ThemedResume from "@/components/resume/ThemedResume";
import VisitPing from "@/components/analytics/VisitPing";

export const metadata: Metadata = {
  title: "Aman Ahmad — Full Stack Developer",
  description: "Experience, projects, and skills — the classic, non-game view.",
  alternates: { canonical: "/resume" },
};

type Props = {
  searchParams: Promise<{ view?: string }>;
};

export default async function ResumePage({ searchParams }: Props) {
  const { view } = await searchParams;
  return (
    <>
      <VisitPing mode="resume" />
      {view === "plain" ? <ClassicResume /> : <ThemedResume />}
    </>
  );
}
