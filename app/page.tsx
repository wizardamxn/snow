import World from "@/components/world/World";
import Overlay from "@/components/overlay/Overlay";
import RotatePrompt from "@/components/overlay/RotatePrompt";

export default function Home() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#0a1026]">
      <World />
      <Overlay />
      <RotatePrompt />
    </main>
  );
}
