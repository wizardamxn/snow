export default function Chip({ children, color = "#3a2800" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="font-pixel text-[6px] px-2 py-1.5 inline-block"
      style={{
        background: color,
        border: "2px solid #000",
        boxShadow: "2px 2px 0 #000",
        color: "#e0d0a0",
      }}
    >
      {children}
    </span>
  );
}
