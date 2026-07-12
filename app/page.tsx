import World from "@/components/world/World";
import Overlay from "@/components/overlay/Overlay";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-sky-300">
      <World />
      <Overlay />
    </main>
  );
}
