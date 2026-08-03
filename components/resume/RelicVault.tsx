import projectsData from "@/lib/data/projects.json";
import QuestPanel from "./QuestPanel";
import Chip from "./Chip";
import ProjectMedia from "./ProjectMedia";
import MobileCollapse from "./MobileCollapse";

type Project = {
  id: string;
  title: string;
  description: string;
  highlights: string[];
  image: string;
  liveUrl?: string;
  livePrivate?: boolean;
  repoUrl?: string;
  repoUrls?: { label: string; url: string }[];
  repoPrivate?: boolean;
  technologies: string[];
  video?: string;
  poster?: string;
};

const projects = projectsData as Project[];

export default function RelicVault() {
  return (
    <QuestPanel title="THE VAULT OF RELICS" subtitle="ARTIFACTS RECOVERED" icon="🏺">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map((p) => {
          const repos = p.repoUrls ?? (p.repoUrl ? [{ label: "CODE", url: p.repoUrl }] : []);
          return (
            <div
              key={p.id}
              style={{ background: "#050400", border: "2px solid #2a1800", boxShadow: "0 0 0 2px #000" }}
            >
              <div className="group relative overflow-hidden" style={{ height: "140px", borderBottom: "2px solid #000" }}>
                <ProjectMedia
                  video={p.video}
                  poster={p.poster}
                  image={p.image}
                  alt={p.title}
                  inViewPlay
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  imageStyle={{ filter: "contrast(1.1) saturate(0.9)" }}
                />
                {p.video && (
                  <span
                    className="absolute top-2 left-2 z-10 font-pixel text-[6px] px-1.5 py-1 inline-flex items-center gap-1"
                    style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #c8861e", color: "#f0c050" }}
                  >
                    <span className="live-dot" style={{ width: 4, height: 4, background: "#8ad060", display: "inline-block", borderRadius: 9999 }} />
                    LIVE DEMO
                  </span>
                )}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(5,4,0,0.92) 0%, rgba(5,4,0,0.15) 55%, transparent 100%)" }}
                />
                {(p.livePrivate || p.repoPrivate) && (
                  <span
                    className="absolute top-2 right-2 font-pixel text-[5px] px-1.5 py-1"
                    style={{ background: "#000", border: "2px solid #3a2808", color: "#ad8c50" }}
                  >
                    PRIVATE ENGAGEMENT
                  </span>
                )}
                <h3 className="absolute bottom-2 left-3 right-3 font-pixel text-[9px]" style={{ color: "#f0c050" }}>
                  ◆ {p.title.toUpperCase()}
                </h3>
              </div>

              <div className="p-4">
                <p className="font-mono text-sm leading-relaxed" style={{ color: "#9a8560" }}>
                  {p.description}
                </p>
                <div className="mt-3">
                  <MobileCollapse summary={`${Math.min(p.highlights.length, 3)} HIGHLIGHTS`}>
                    <ul className="space-y-1.5">
                      {p.highlights.slice(0, 3).map((h) => (
                        <li key={h} className="flex gap-2 font-mono text-xs leading-relaxed" style={{ color: "#a58e65" }}>
                          <span style={{ color: "#c8861e" }} className="select-none">
                            —
                          </span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </MobileCollapse>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.technologies.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.liveUrl && !p.livePrivate && (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-pixel text-[7px] px-2.5 py-2"
                      style={{ background: "#0a2000", border: "2px solid #2a5a10", color: "#8ad060" }}
                    >
                      ENTER PORTAL ↗
                    </a>
                  )}
                  {!p.repoPrivate &&
                    repos.map((r) => (
                      <a
                        key={r.label}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-pixel text-[7px] px-2.5 py-2"
                        style={{ background: "#1a0a00", color: "#c8861e", border: "2px solid #c8861e" }}
                      >
                        {r.label.toUpperCase()} ↗
                      </a>
                    ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </QuestPanel>
  );
}
