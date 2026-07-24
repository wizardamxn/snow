"use client";

import Image from "next/image";
import Link from "next/link";
import experience from "@/lib/data/experience.json";
import projects from "@/lib/data/projects.json";
import skills from "@/lib/data/skills.json";
import testimonials from "@/lib/data/testimonials.json";
import ViewToggle from "./ViewToggle";
import StatsFooter from "./StatsFooter";
import { track } from "@/lib/analytics/track";

const NAV = [
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#achievements", label: "Achievements" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#contact", label: "Contact" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-6">
      {children}
    </h2>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">
      {children}
    </span>
  );
}

/**
 * The plain, non-game view — kept byte-for-byte the same as before the
 * themed redesign. Recruiters/ATS/printing want this, not pixel art.
 */
export default function ClassicResume() {
  return (
    <main className="min-h-dvh bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200">
      {/* ── Sticky nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-3 flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Aman Ahmad
          </span>
          <nav className="hidden sm:flex items-center gap-5">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <ViewToggle active="plain" />
            <Link
              href="/?play=1"
              className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors whitespace-nowrap"
            >
              Play the game →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12 space-y-16">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="flex flex-col sm:flex-row items-start gap-6">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200 dark:ring-neutral-800">
            <Image src="/avatar.webp" alt="Aman Ahmad" fill sizes="80px" className="object-cover object-top" priority />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Aman Ahmad
            </h1>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">Full Stack Developer Intern</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              Full-stack developer (B.Tech &apos;27) with two production internships, shipping
              web and mobile apps end-to-end — React, Next.js, Node, React Native, AWS EC2.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Open to opportunities
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a href="mailto:amank225566@gmail.com" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                amank225566@gmail.com
              </a>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <a href="https://github.com/wizardamxn" target="_blank" rel="noopener noreferrer" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                github.com/wizardamxn
              </a>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <a href="https://linkedin.com/in/amanahmad1" target="_blank" rel="noopener noreferrer" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                linkedin.com/in/amanahmad1
              </a>
              <span className="text-neutral-300 dark:text-neutral-700">·</span>
              <a href="/resume.pdf" download onClick={() => track("resume_download")} className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                Download PDF
              </a>
            </div>
          </div>
        </section>

        {/* ── Stats strip ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-4 gap-4 border-y border-neutral-200 dark:border-neutral-800 py-6 text-center">
          {[
            { label: "Experience", value: "9+ mo" },
            { label: "Internships", value: "2" },
            { label: "Projects", value: "5" },
            { label: "Stack", value: "Full" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{s.value}</div>
              <div className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── Experience ─────────────────────────────────────────────────── */}
        <section id="experience" className="scroll-mt-20">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-8">
            {experience.map((job) => (
              <div key={job.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                    {job.role} · {job.company}
                  </h3>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {job.period}
                    {job.current && (
                      <span className="ml-2 rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400">
                        Current
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{job.location}</p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {job.summary}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {job.highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      <span className="text-amber-500 dark:text-amber-500 select-none">—</span>
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.technologies.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects ────────────────────────────────────────────────────── */}
        <section id="projects" className="scroll-mt-20">
          <SectionHeading>Projects</SectionHeading>
          <div className="space-y-8">
            {projects.map((p) => (
              <div key={p.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{p.title}</h3>
                  <div className="flex gap-3 text-xs">
                    {p.liveUrl && !p.livePrivate && (
                      <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                        Live ↗
                      </a>
                    )}
                    {"repoUrl" in p && p.repoUrl && !p.repoPrivate && (
                      <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                        Code ↗
                      </a>
                    )}
                    {"repoUrls" in p &&
                      p.repoUrls?.map((r) => (
                        <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400">
                          {r.label} ↗
                        </a>
                      ))}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {p.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.technologies.map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Skills ──────────────────────────────────────────────────────── */}
        <section id="skills" className="scroll-mt-20">
          <SectionHeading>Skills</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-6">
            {skills.map((cat) => (
              <div key={cat.category}>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                  {cat.category}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {cat.skills.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Achievements ────────────────────────────────────────────────── */}
        <section id="achievements" className="scroll-mt-20">
          <SectionHeading>Achievements &amp; Leadership</SectionHeading>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              <span className="text-amber-500 dark:text-amber-500 select-none">—</span>
              <span>
                <strong className="text-neutral-900 dark:text-neutral-100">Winner, HackJEC 4.0 Hackathon</strong> —
                1st place among 50+ teams for a full-stack health application built in 24 hours.
              </span>
            </li>
            <li className="flex gap-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              <span className="text-amber-500 dark:text-amber-500 select-none">—</span>
              <span>
                <strong className="text-neutral-900 dark:text-neutral-100">Technical Team, Karwaan JEC</strong> —
                deployed event platforms and hosted engineering workshops for college-wide tech initiatives.
              </span>
            </li>
          </ul>
        </section>

        {/* ── Testimonials ────────────────────────────────────────────────── */}
        <section id="testimonials" className="scroll-mt-20">
          <SectionHeading>Testimonials</SectionHeading>
          <div className="grid sm:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <blockquote key={t.name} className="border-l-2 border-amber-400 dark:border-amber-600 pl-4">
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-3 text-sm">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{t.name}</span>
                  <span className="text-neutral-500 dark:text-neutral-400"> — {t.role}, {t.company}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ── Contact ─────────────────────────────────────────────────────── */}
        <section id="contact" className="scroll-mt-20 border-t border-neutral-200 dark:border-neutral-800 pt-10 text-center">
          <SectionHeading>Get in touch</SectionHeading>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            Open to new opportunities — the fastest way to reach me:
          </p>
          <a
            href="mailto:amank225566@gmail.com"
            className="mt-3 inline-block text-lg font-semibold text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400"
          >
            amank225566@gmail.com
          </a>
          <div className="mt-6 flex justify-center gap-4 text-sm">
            <a href="https://github.com/wizardamxn" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
              GitHub
            </a>
            <a href="https://linkedin.com/in/amanahmad1" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
              LinkedIn
            </a>
            <a href="/resume.pdf" download onClick={() => track("resume_download")} className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
              Resume (PDF)
            </a>
            <Link href="/?play=1" className="text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
              Play the game
            </Link>
          </div>
          <StatsFooter variant="plain" />
        </section>
      </div>
    </main>
  );
}
