import { Assets, Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { worldState } from "@/lib/world/worldState";
import { bus } from "@/lib/world/bus";
import projects from "@/lib/data/projects.json";

export type StationsController = {
  container: Container;
  update: (scale: number, currentKnightScreenX: number) => void;
};

const FIRST_X = 1400;
const SPACING = 2800;
const NEAR_RANGE = 90;
// Building sprite bottom = ground line. Using anchor 1.0 ensures they sit ON it.
const BASE_ANCHOR_Y = 1.0;

// Tiny Swords buildings, cycled per project as the landmark for each station.
const BUILDING_URLS = [
  "/pixel/props/House1.png",
  "/pixel/props/House2.png",
  "/pixel/props/House3.png",
  "/pixel/props/Tower.png",
];

function buildStation(
  title: string,
  texture: Texture,
  displayH: number,
): { node: Container; prompt: Container } {
  const node = new Container();

  const building = new Sprite(texture);
  building.anchor.set(0.5, BASE_ANCHOR_Y);
  building.height = displayH;
  building.width = displayH * (texture.width / texture.height);
  
  // Add a contact shadow under the building base
  const shadowW = building.width * 0.45;
  const shadowH = shadowW * 0.2;
  const shadow = new Graphics()
    .ellipse(0, 0, shadowW, shadowH)
    .fill({ color: 0x000000, alpha: 0.28 });
  node.addChild(shadow);
  node.addChild(building);

  const labelY = -displayH - 14;
  const board = new Graphics()
    .roundRect(-64, labelY - 16, 128, 32, 6)
    .fill({ color: 0x1a1206, alpha: 0.85 })
    .stroke({ width: 2, color: 0xffc061 });
  const label = new Text({
    text: title,
    style: {
      fontFamily: "monospace",
      fontSize: 14,
      fontWeight: "bold",
      fill: 0xffe9c8,
    },
  });
  label.anchor.set(0.5);
  label.position.set(0, labelY);
  node.addChild(board, label);

  // Floating "inspect" prompt, shown only when the knight is near.
  const prompt = new Container();
  const promptY = labelY - 34;
  const bubble = new Graphics()
    .roundRect(-52, promptY - 13, 104, 26, 6)
    .fill({ color: 0x1a1206, alpha: 0.85 })
    .stroke({ width: 2, color: 0xffc061 });
  const promptText = new Text({
    text: "▸ E / tap",
    style: { fontFamily: "monospace", fontSize: 13, fill: 0xffe9c8 },
  });
  promptText.anchor.set(0.5);
  promptText.position.set(0, promptY);
  prompt.addChild(bubble, promptText);
  prompt.visible = false;
  node.addChild(prompt);

  return { node, prompt };
}

export async function createStations(
  knightScreenX: number,
  groundY: number,
  displayH: number,
): Promise<StationsController> {
  const textures = (await Promise.all(
    BUILDING_URLS.map((u) => Assets.load(u)),
  )) as Texture[];
  textures.forEach((t) => (t.source.scaleMode = "nearest"));

  const container = new Container();

  const stations = projects.map((p, i) => {
    const texture = textures[i % textures.length];
    const { node, prompt } = buildStation(p.title, texture, displayH);
    node.y = 0; // relative Y inside the container
    node.eventMode = "static";
    node.cursor = "pointer";
    node.on("pointertap", () => bus.emitOpen(p.id));
    container.addChild(node);
    return { id: p.id, worldX: FIRST_X + i * SPACING, node, prompt };
  });

  let nearId: string | null = null;

  const update = (scale: number, currentKnightScreenX: number) => {
    let newNear: string | null = null;
    for (const s of stations) {
      // Divide by scale because the container itself is scaled horizontally by Pixi
      s.node.x = currentKnightScreenX / scale + (s.worldX - worldState.worldX);
      const near = Math.abs(s.worldX - worldState.worldX) < NEAR_RANGE;
      s.prompt.visible = near;
      if (near) newNear = s.id;
    }
    if (newNear !== nearId) {
      nearId = newNear;
      bus.emitNear(nearId);
    }
  };

  return { container, update };
}
