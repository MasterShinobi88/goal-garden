/**
 * Plant species for progress trees — each goal can grow a different plant.
 */

export type PlantType =
  | "oak"
  | "bamboo"
  | "maple"
  | "sakura"
  | "pine"
  | "willow"
  | "bonsai"
  | "sunflower";

export type PlantPalette = {
  leafA: string;
  leafB: string;
  leafC: string;
  trunkA: string;
  trunkB: string;
  accent: string; // fruit, blossom, flower center
  glow: string;
  groundA: string;
  groundB: string;
  progressFrom: string;
  progressTo: string;
};

export type PlantMeta = {
  id: PlantType;
  label: string;
  emoji: string;
  blurb: string;
  stages: [string, string, string, string, string, string];
  palette: PlantPalette;
};

export const PLANT_TYPES: PlantType[] = [
  "oak",
  "bamboo",
  "maple",
  "sakura",
  "pine",
  "willow",
  "bonsai",
  "sunflower",
];

export const PLANTS: Record<PlantType, PlantMeta> = {
  oak: {
    id: "oak",
    label: "Oak tree",
    emoji: "🌳",
    blurb: "Classic sturdy canopy — fruits at full growth",
    stages: [
      "Sapling",
      "Sprout",
      "Young oak",
      "Branching",
      "Leafy canopy",
      "Fruiting oak",
    ],
    palette: {
      leafA: "#34d399",
      leafB: "#10b981",
      leafC: "#6ee7b7",
      trunkA: "#8b5e3c",
      trunkB: "#5c3b22",
      accent: "#fbbf24",
      glow: "rgba(52,211,153,0.25)",
      groundA: "#14532d",
      groundB: "#166534",
      progressFrom: "#047857",
      progressTo: "#34d399",
    },
  },
  bamboo: {
    id: "bamboo",
    label: "Bamboo",
    emoji: "🎋",
    blurb: "Tall green shoots — grows fast in segments",
    stages: [
      "Shoot",
      "First cane",
      "Rising grove",
      "Tall canes",
      "Leafy bamboo",
      "Full grove",
    ],
    palette: {
      leafA: "#4ade80",
      leafB: "#22c55e",
      leafC: "#86efac",
      trunkA: "#a3e635",
      trunkB: "#65a30d",
      accent: "#fef08a",
      glow: "rgba(132,204,22,0.22)",
      groundA: "#14532d",
      groundB: "#3f6212",
      progressFrom: "#4d7c0f",
      progressTo: "#a3e635",
    },
  },
  maple: {
    id: "maple",
    label: "Maple",
    emoji: "🍁",
    blurb: "Warm autumn leaves — fiery when fully grown",
    stages: [
      "Seedling",
      "Young maple",
      "Spreading",
      "Autumn flush",
      "Fiery canopy",
      "Peak maple",
    ],
    palette: {
      leafA: "#f97316",
      leafB: "#ef4444",
      leafC: "#fbbf24",
      trunkA: "#78716c",
      trunkB: "#44403c",
      accent: "#fde047",
      glow: "rgba(249,115,22,0.22)",
      groundA: "#7c2d12",
      groundB: "#9a3412",
      progressFrom: "#c2410c",
      progressTo: "#fb923c",
    },
  },
  sakura: {
    id: "sakura",
    label: "Sakura (cherry)",
    emoji: "🌸",
    blurb: "Japanese pink cherry blossoms",
    stages: [
      "Bud",
      "First bloom",
      "Blossoming",
      "Pink canopy",
      "Full sakura",
      "Petal snow",
    ],
    palette: {
      leafA: "#f9a8d4",
      leafB: "#f472b6",
      leafC: "#fce7f3",
      trunkA: "#a8a29e",
      trunkB: "#57534e",
      accent: "#fda4af",
      glow: "rgba(244,114,182,0.28)",
      groundA: "#4c1d3d",
      groundB: "#831843",
      progressFrom: "#be185d",
      progressTo: "#f9a8d4",
    },
  },
  pine: {
    id: "pine",
    label: "Pine",
    emoji: "🌲",
    blurb: "Evergreen needles — sharp and resilient",
    stages: [
      "Seedling",
      "Young pine",
      "Needle tree",
      "Tall pine",
      "Evergreen",
      "Majestic pine",
    ],
    palette: {
      leafA: "#15803d",
      leafB: "#166534",
      leafC: "#4ade80",
      trunkA: "#78350f",
      trunkB: "#451a03",
      accent: "#a3a3a3",
      glow: "rgba(22,101,52,0.3)",
      groundA: "#1c1917",
      groundB: "#365314",
      progressFrom: "#14532d",
      progressTo: "#4ade80",
    },
  },
  willow: {
    id: "willow",
    label: "Willow",
    emoji: "🌿",
    blurb: "Graceful drooping branches",
    stages: [
      "Whip",
      "Young willow",
      "Arching",
      "Weeping form",
      "Curtain leaves",
      "Full willow",
    ],
    palette: {
      leafA: "#86efac",
      leafB: "#4ade80",
      leafC: "#bbf7d0",
      trunkA: "#a8a29e",
      trunkB: "#78716c",
      accent: "#fde68a",
      glow: "rgba(134,239,172,0.22)",
      groundA: "#14532d",
      groundB: "#365314",
      progressFrom: "#15803d",
      progressTo: "#86efac",
    },
  },
  bonsai: {
    id: "bonsai",
    label: "Bonsai",
    emoji: "🪴",
    blurb: "Miniature sculpted tree in a pot",
    stages: [
      "Starter",
      "Wired form",
      "Shaping",
      "Mature style",
      "Show bonsai",
      "Masterpiece",
    ],
    palette: {
      leafA: "#22c55e",
      leafB: "#16a34a",
      leafC: "#86efac",
      trunkA: "#92400e",
      trunkB: "#451a03",
      accent: "#fbbf24",
      glow: "rgba(34,197,94,0.22)",
      groundA: "#44403c",
      groundB: "#57534e",
      progressFrom: "#166534",
      progressTo: "#4ade80",
    },
  },
  sunflower: {
    id: "sunflower",
    label: "Sunflower",
    emoji: "🌻",
    blurb: "Bright flower that faces the light",
    stages: [
      "Seed",
      "Sprout",
      "Tall stem",
      "Budding",
      "Opening bloom",
      "Full sunflower",
    ],
    palette: {
      leafA: "#4ade80",
      leafB: "#22c55e",
      leafC: "#86efac",
      trunkA: "#84cc16",
      trunkB: "#4d7c0f",
      accent: "#facc15",
      glow: "rgba(250,204,21,0.28)",
      groundA: "#713f12",
      groundB: "#a16207",
      progressFrom: "#ca8a04",
      progressTo: "#fde047",
    },
  },
};

export const DEFAULT_PLANT: PlantType = "oak";

export function isPlantType(v: unknown): v is PlantType {
  return typeof v === "string" && (PLANT_TYPES as string[]).includes(v);
}

export function getPlant(type?: PlantType | null): PlantMeta {
  if (type && PLANTS[type]) return PLANTS[type];
  return PLANTS[DEFAULT_PLANT];
}

/** Pick a nice default plant from goal title keywords */
export function suggestPlantFromTitle(title: string): PlantType {
  const t = title.toLowerCase();
  if (/japan|sakura|cherry|pink|blossom|zen/.test(t)) return "sakura";
  if (/bamboo|asia|zen|flexible|fast/.test(t)) return "bamboo";
  if (/autumn|fall|canada|maple|fire|warm/.test(t)) return "maple";
  if (/pine|mountain|winter|evergreen|forest|longevity|anti-?age/.test(t))
    return "pine";
  if (/calm|flow|grace|soft|willow|mindset|meditat/.test(t)) return "willow";
  if (/focus|minimal|patient|bonsai|craft|mindful/.test(t)) return "bonsai";
  if (/happy|bright|energy|sun|joy|summer/.test(t)) return "sunflower";
  if (/money|save|wealth|oak|strong|career/.test(t)) return "oak";
  return "oak";
}
