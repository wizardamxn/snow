import Link from "next/link";
import ViewToggle from "./ViewToggle";
import Fireflies from "./Fireflies";
import ShootingStars from "./ShootingStars";
import QuestProgress from "./QuestProgress";
import Reveal from "./Reveal";
import HeroBanner from "./HeroBanner";
import StatBlock from "./StatBlock";
import NowPlaying from "./NowPlaying";
import CampaignLog from "./CampaignLog";
import RelicVault from "./RelicVault";
import ArmorySkills from "./ArmorySkills";
import GithubChronicle from "./GithubChronicle";
import TrophyHall from "./TrophyHall";
import AllyWords from "./AllyWords";
import RavenContact from "./RavenContact";
import StatsFooter from "./StatsFooter";

const NAV = [
  { href: "#campaign", label: "Campaign" },
  { href: "#relics", label: "Relics" },
  { href: "#armory", label: "Armory" },
  { href: "#github", label: "GitHub" },
  { href: "#valor", label: "Valor" },
  { href: "#allies", label: "Allies" },
  { href: "#contact", label: "Contact" },
];

/**
 * The themed ("Adventurer's Quest Log") resume — same content as
 * ClassicResume, restyled in the game's own gold/navy pixel language, with
 * animated sprite-sheets reused from the game's own asset pack.
 */
export default function ThemedResume() {
  // NB: main uses overflow-clip, not overflow-hidden. overflow-hidden establishes
  // a scroll container, which silently breaks the sticky header (and its
  // quest-progress bar) — pinning it to main's top, which then scrolls away with
  // the page. overflow-clip still contains the drifting backdrop/fireflies.
  return (
    <main className="relative min-h-dvh overflow-clip" style={{ background: "#0a1026" }}>
      {/* ── Fixed backdrop — the pixel town at night. Held still (not scrolling)
          so the quest log reads like a scroll unfurled over a living scene. A
          plain fixed layer rather than background-attachment:fixed, which iOS
          Safari silently ignores. Falls back to the navy base if the file is
          missing. ─────────────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="backdrop-drift fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/cbg.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center 45%",
          imageRendering: "pixelated",
        }}
      />
      {/* Cinematic scrim: the art is already a dark night, so rather than a flat
          wash (which muddied it) we keep a light tint through the middle and
          darken only the nav/footer bands and the corners — a vignette that
          frames the castle & skyline while keeping text legible. Fixed too, so
          the framing is identical in every viewport as you scroll. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(8,12,30,0.88) 0%, rgba(8,12,30,0.32) 15%, rgba(8,12,30,0.32) 76%, rgba(8,12,30,0.95) 100%), radial-gradient(135% 100% at 50% 34%, rgba(8,12,30,0) 40%, rgba(8,12,30,0.66) 100%)",
        }}
      />
      {/* Drifting fireflies + the odd shooting star — what makes the still night
          scene feel alive without a single frame of game engine running. */}
      <Fireflies />
      <ShootingStars />

      {/* ── Sticky nav ─────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20"
        style={{ background: "rgba(8,12,30,0.85)", borderBottom: "3px solid #000", boxShadow: "0 2px 0 #c8861e" }}
      >
        <div className="mx-auto max-w-4xl px-6 py-3 flex items-center justify-between gap-4">
          <a href="#top" className="font-pixel text-[8px] text-[#f0c050] hover:text-white transition-colors">
            AMAN AHMAD
          </a>
          <nav className="hidden md:flex items-center gap-4">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="font-pixel text-[7px] text-[#b78a2a] hover:text-[#f0c050] transition-colors"
              >
                {n.label.toUpperCase()}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <ViewToggle active="themed" />
            <Link
              href="/?play=1"
              className="font-pixel text-[7px] px-2 py-2 whitespace-nowrap text-[#8ad060] hover:text-[#c0f0a0] transition-colors"
            >
              PLAY →
            </Link>
          </div>
        </div>
        {/* Quest-progress XP bar — fills as you scroll, one pip per hall, with a
            live "current objective" readout (the only wayfinding on mobile,
            where the nav above is hidden). */}
        <QuestProgress sections={NAV} />
      </header>

      <div id="top" className="relative z-10 mx-auto max-w-4xl px-6 pt-10 pb-24 space-y-10">
        <HeroBanner />
        <StatBlock />
        <NowPlaying />
        <Reveal id="campaign" className="scroll-mt-28">
          <CampaignLog />
        </Reveal>
        <Reveal id="relics" className="scroll-mt-28">
          <RelicVault />
        </Reveal>
        <Reveal id="armory" className="scroll-mt-28">
          <ArmorySkills />
        </Reveal>
        <Reveal id="github" className="scroll-mt-28">
          <GithubChronicle />
        </Reveal>
        <Reveal id="valor" className="scroll-mt-28">
          <TrophyHall />
        </Reveal>
        <Reveal id="allies" className="scroll-mt-28">
          <AllyWords />
        </Reveal>
        <Reveal id="contact" className="scroll-mt-28">
          <RavenContact />
        </Reveal>
        <StatsFooter variant="pixel" />
      </div>
    </main>
  );
}
