"use client";

import { useEffect, useRef, useState } from "react";
import InfoPanel from "../InfoPanel";
import experience from "@/lib/data/experience.json";
import projects from "@/lib/data/projects.json";
import skills from "@/lib/data/skills.json";

type Props = { onClose: () => void };
type Line = { text: string; kind: "output" | "echo" };

const PROMPT = "guest@amanahmad:~$";

const ABOUT = [
  "Aman Ahmad — Full Stack Developer.",
  "Shipping production-grade apps: React, Next.js, Node, React Native, AWS EC2.",
  "Currently @ Cerope. Previously @ KodeCompiler. A handful of freelance builds on the side.",
];

const EXPERIENCE = experience.flatMap((job) => [
  `${job.role} — ${job.company} (${job.period})${job.current ? "  [current]" : ""}`,
  `  ${job.summary}`,
  "",
]);

const SKILLS_OUT = skills.map((cat) => `${cat.category}: ${cat.skills.join(", ")}`);

const PROJECTS_OUT = projects.flatMap((p) => [
  `${p.title} — ${p.description}`,
  `  tech: ${p.technologies.join(", ")}`,
  "",
]);

const CONTACT = [
  "email:  amank225566@gmail.com",
  "github: github.com/wizardamxn",
  "status: open to opportunities",
];

const LS_OUTPUT = "about.txt  experience.log  projects.json  skills.json  contact.card  resume.pdf";

const HELP = [
  "Available commands:",
  "  whoami        who's running this thing",
  "  about         short bio",
  "  experience    work history",
  "  projects      things I've shipped",
  "  skills        the stack",
  "  contact       how to reach me",
  "  resume        download the PDF",
  "  ls            list files",
  "  cat <file>    read a file",
  "  clear         clear the screen",
  "  exit          leave the terminal",
];

const BOOT_LINES = [
  "AMAN-OS v1.0.0",
  "Loading personality.dll... done",
  "Type 'help' to see available commands.",
];

const FILES: Record<string, string[]> = {
  "about.txt": ABOUT,
  "experience.log": EXPERIENCE,
  "skills.json": SKILLS_OUT,
  "projects.json": PROJECTS_OUT,
  "contact.card": CONTACT,
};

export default function TerminalPanel({ onClose }: Props) {
  const [lines, setLines] = useState<Line[]>(BOOT_LINES.map((text) => ({ text, kind: "output" })));
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const print = (text: string[]) => {
    setLines((prev) => [...prev, ...text.map((t) => ({ text: t, kind: "output" as const }))]);
  };

  const run = (raw: string) => {
    const trimmed = raw.trim();
    setLines((prev) => [...prev, { text: `${PROMPT} ${raw}`, kind: "echo" }]);
    if (trimmed) setHistory((prev) => [...prev, trimmed]);
    setHistIdx(null);

    const [cmd, ...args] = trimmed.split(/\s+/);
    switch (cmd?.toLowerCase()) {
      case undefined:
      case "":
        break;
      case "help":
        print(HELP);
        break;
      case "whoami":
        print(["aman_ahmad — full stack developer, probably debugging something right now."]);
        break;
      case "about":
        print(ABOUT);
        break;
      case "experience":
        print(EXPERIENCE);
        break;
      case "skills":
        print(SKILLS_OUT);
        break;
      case "projects":
        print(PROJECTS_OUT);
        break;
      case "contact":
        print(CONTACT);
        break;
      case "resume":
        print(["Downloading resume.pdf..."]);
        window.open("/resume.pdf", "_blank");
        break;
      case "ls":
        print([LS_OUTPUT]);
        break;
      case "cat": {
        const file = args[0];
        const content = file ? FILES[file] : undefined;
        if (!file) print(["usage: cat <file>"]);
        else if (content) print(content);
        else print([`cat: ${file}: No such file`]);
        break;
      }
      case "clear":
        setLines([]);
        return;
      case "exit":
      case "quit":
        onClose();
        return;
      case "sudo":
        print(["Nice try. This isn't a real shell — no root for you."]);
        break;
      case "sl":
        print(["    ====        ________                ___________", "_D _|  |_______/        \\__I_I_____===__|_________|", " |(_)---  |   H\\________/ |   |        =|___ ___|", " /     |  |   H  |  |     |   |         ||_| |_||", "|      |  |   H  |__--------------------| [___] |", "| ________|___H__/__|_____/[][]~\\_______|       |", "|/ |   |-----------I_____I [][] []  D   |=======|"]);
        break;
      case "matrix":
        print(["Wake up, Aman... the resume is calling."]);
        break;
      default:
        print([`command not found: ${cmd}. Type 'help' for a list.`]);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Let ESC bubble to InfoPanel's own close handler; swallow everything
    // else so it doesn't also drive player movement in the game behind this.
    if (e.key !== "Escape") e.stopPropagation();

    if (e.key === "Enter") {
      run(draft);
      setDraft("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const next = histIdx === null ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setDraft(history[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx === null) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(null);
        setDraft("");
      } else {
        setHistIdx(next);
        setDraft(history[next]);
      }
    }
  };

  return (
    <InfoPanel title="THE TERMINAL" subtitle="ACCESS GRANTED" icon="💻" onClose={onClose} maxWidth="max-w-2xl">
      <div
        className="p-3 font-mono text-[13px] leading-relaxed"
        style={{ background: "#050705", border: "2px solid #0d1c0d", minHeight: "320px" }}
        onClick={() => inputRef.current?.focus()}
      >
        <div ref={scrollRef} className="max-h-[45vh] overflow-y-auto pixel-scroll">
          {lines.map((l, i) => (
            <div
              key={i}
              style={{ color: l.kind === "echo" ? "#7fe89c" : "#3ddc5a", whiteSpace: "pre-wrap" }}
            >
              {l.text}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1" style={{ color: "#7fe89c" }}>
          <span className="shrink-0">{PROMPT}</span>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onKeyUp={(e) => {
              if (e.key !== "Escape") e.stopPropagation();
            }}
            className="flex-1 bg-transparent outline-none border-none"
            style={{ color: "#3ddc5a", caretColor: "#3ddc5a" }}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </InfoPanel>
  );
}
