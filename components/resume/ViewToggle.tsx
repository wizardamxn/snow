import Link from "next/link";

/** Pure-link toggle between the themed and plain resume — no client JS needed. */
export default function ViewToggle({ active }: { active: "themed" | "plain" }) {
  const base: React.CSSProperties = {
    fontSize: "7px",
    padding: "8px 10px",
    letterSpacing: "0.08em",
  };
  const activeStyle: React.CSSProperties = {
    ...base,
    background: "#c8861e",
    color: "#000",
    border: "2px solid #000",
    boxShadow: "2px 2px 0 #000",
  };
  const inactiveStyle: React.CSSProperties = {
    ...base,
    background: "#1a0a00",
    color: "#c8861e",
    border: "2px solid #5a4020",
  };

  return (
    <div className="flex gap-1.5">
      <Link href="/resume" className="font-pixel" style={active === "themed" ? activeStyle : inactiveStyle}>
        THEMED
      </Link>
      <Link href="/resume?view=plain" className="font-pixel" style={active === "plain" ? activeStyle : inactiveStyle}>
        PLAIN
      </Link>
    </div>
  );
}
