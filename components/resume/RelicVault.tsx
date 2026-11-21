import QuestPanel from "./QuestPanel";
import ProjectScroll from "./ProjectScroll";

/** Projects on the themed resume: a poster wall; tap one for its detail scroll. */
export default function RelicVault() {
  return (
    <QuestPanel title="THE VAULT OF RELICS" subtitle="ARTIFACTS RECOVERED" icon="🏺">
      <ProjectScroll />
    </QuestPanel>
  );
}
