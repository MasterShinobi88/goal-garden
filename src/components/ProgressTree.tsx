"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { getTreeStage } from "@/lib/utils";
import {
  DEFAULT_PLANT,
  getPlant,
  type PlantType,
} from "@/lib/plants";

type Props = {
  progress: number;
  label?: string;
  size?: number;
  /** Species of plant to grow (default oak) */
  plant?: PlantType | null;
};

/**
 * SVG progress plant: sapling → mature form as milestones/tasks complete.
 * Supports oak, bamboo, maple, sakura, pine, willow, bonsai, sunflower.
 */
export function ProgressTree({
  progress,
  label,
  size = 280,
  plant: plantType = DEFAULT_PLANT,
}: Props) {
  const plant = getPlant(plantType);
  const stage = getTreeStage(progress);
  const clamped = Math.max(0, Math.min(100, progress));
  const [pulse, setPulse] = useState(false);
  const uid = useId().replace(/:/g, "");

  useEffect(() => {
    let t: number | undefined;
    const onCelebrate = () => {
      setPulse(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setPulse(false), 900);
    };
    window.addEventListener("goal-garden:celebrate", onCelebrate);
    return () => {
      window.removeEventListener("goal-garden:celebrate", onCelebrate);
      window.clearTimeout(t);
    };
  }, []);

  const p = plant.palette;
  const skyId = `sky-${uid}`;
  const glowId = `glow-${uid}`;
  const trunkId = `trunk-${uid}`;
  const leafId = `leaf-${uid}`;

  const foliage = useMemo(
    () => buildFoliage(plant.id, stage),
    [plant.id, stage]
  );

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 280 280"
        className={`tree-grow drop-shadow-lg transition-transform duration-500 ${
          pulse ? "scale-105" : "scale-100"
        }`}
        role="img"
        aria-label={`${plant.label} at ${clamped}% growth`}
      >
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0b1f1a" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={p.glow} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id={trunkId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={p.trunkA} />
            <stop offset="100%" stopColor={p.trunkB} />
          </linearGradient>
          <linearGradient id={leafId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.leafC} />
            <stop offset="100%" stopColor={p.leafB} />
          </linearGradient>
        </defs>

        <rect width="280" height="280" rx="24" fill={`url(#${skyId})`} />
        <circle cx="140" cy="120" r="90" fill={`url(#${glowId})`} />

        {/* ground / pot */}
        {plant.id === "bonsai" ? (
          <>
            <ellipse cx="140" cy="232" rx="52" ry="10" fill={p.groundA} opacity="0.5" />
            <path
              d="M100 210 L108 235 Q140 248 172 235 L180 210 Z"
              fill={p.groundB}
              opacity="0.95"
            />
            <ellipse cx="140" cy="210" rx="42" ry="8" fill={p.groundA} />
          </>
        ) : (
          <>
            <ellipse
              cx="140"
              cy="230"
              rx="70"
              ry="14"
              fill={p.groundA}
              opacity="0.55"
            />
            <ellipse
              cx="140"
              cy="228"
              rx="48"
              ry="8"
              fill={p.groundB}
              opacity="0.7"
            />
          </>
        )}

        <g className="tree-sway">{foliage}</g>

        {/* stage label badge */}
        <rect
          x="70"
          y="248"
          width="140"
          height="22"
          rx="11"
          fill="rgba(15,23,42,0.75)"
        />
        <text
          x="140"
          y="263"
          textAnchor="middle"
          fill={p.leafC}
          fontSize="11"
          fontFamily="system-ui"
        >
          {plant.stages[stage]}
        </text>
      </svg>

      <div className="mt-3 w-full max-w-[280px]">
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span className="truncate">
            {label ?? "Growth"}
            <span className="ml-1.5 opacity-70">
              {plant.emoji} {plant.label}
            </span>
          </span>
          <span
            className="shrink-0 font-semibold"
            style={{ color: p.progressTo }}
          >
            {clamped}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${clamped}%`,
              background: `linear-gradient(90deg, ${p.progressFrom}, ${p.progressTo})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function buildFoliage(type: PlantType, stage: number) {
  switch (type) {
    case "bamboo":
      return <Bamboo stage={stage} />;
    case "maple":
      return <MapleTree stage={stage} />;
    case "sakura":
      return <SakuraTree stage={stage} />;
    case "pine":
      return <PineTree stage={stage} />;
    case "willow":
      return <WillowTree stage={stage} />;
    case "bonsai":
      return <BonsaiTree stage={stage} />;
    case "sunflower":
      return <Sunflower stage={stage} />;
    case "oak":
    default:
      return <OakTree stage={stage} />;
  }
}

/* ─── Oak (classic) ─────────────────────────────────────────── */

function OakTree({ stage }: { stage: number }) {
  const plant = getPlant("oak");
  const p = plant.palette;
  const trunkHeight = 40 + stage * 14;
  const canopyR = 18 + stage * 12;
  const leaves = useMemo(() => {
    const count = [0, 2, 5, 9, 14, 18][stage];
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 1.6 - 0.8;
      const radius = 28 + (i % 4) * 10 + stage * 4;
      return {
        x: 140 + Math.cos(angle) * radius,
        y: 95 - Math.sin(angle) * radius * 0.85 - stage * 4,
        r: 6 + (i % 3),
      };
    });
  }, [stage]);
  const fruits = useMemo(() => {
    if (stage < 4) return [];
    const count = stage === 5 ? 6 : 3;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 1.4 - 0.7;
      const radius = 36 + i * 6;
      return {
        x: 140 + Math.cos(angle) * radius,
        y: 100 - Math.sin(angle) * radius * 0.9,
      };
    });
  }, [stage]);

  return (
    <>
      <path
        d={`M130 220 C128 ${220 - trunkHeight * 0.4}, 132 ${220 - trunkHeight * 0.75}, 138 ${220 - trunkHeight}
            L148 ${220 - trunkHeight}
            C154 ${220 - trunkHeight * 0.75}, 152 ${220 - trunkHeight * 0.4}, 150 220 Z`}
        fill={p.trunkA}
      />
      {stage >= 2 && (
        <>
          <path
            d={`M142 ${220 - trunkHeight + 20} Q110 ${220 - trunkHeight - 10}, 90 ${220 - trunkHeight - 5}`}
            stroke={p.trunkB}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M145 ${220 - trunkHeight + 28} Q175 ${220 - trunkHeight - 5}, 195 ${220 - trunkHeight}`}
            stroke={p.trunkB}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {stage >= 3 && (
        <>
          <path
            d={`M140 ${220 - trunkHeight + 8} Q120 ${220 - trunkHeight - 30}, 105 ${220 - trunkHeight - 35}`}
            stroke={p.trunkB}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M146 ${220 - trunkHeight + 12} Q170 ${220 - trunkHeight - 28}, 188 ${220 - trunkHeight - 32}`}
            stroke={p.trunkB}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {stage >= 1 && (
        <circle
          cx="142"
          cy={220 - trunkHeight - 8}
          r={canopyR}
          fill={p.leafB}
          opacity={0.85}
          className="leaf-pop"
        />
      )}
      {stage === 0 && (
        <>
          <ellipse
            cx="134"
            cy="175"
            rx="8"
            ry="5"
            fill={p.leafA}
            transform="rotate(-30 134 175)"
          />
          <ellipse
            cx="152"
            cy="178"
            rx="8"
            ry="5"
            fill={p.leafB}
            transform="rotate(25 152 178)"
          />
        </>
      )}
      {leaves.map((l, i) => (
        <ellipse
          key={i}
          cx={l.x}
          cy={l.y}
          rx={l.r}
          ry={l.r * 0.65}
          fill={i % 2 ? p.leafA : p.leafB}
          opacity={0.9}
          className="leaf-pop"
          transform={`rotate(${(i * 27) % 60 - 30} ${l.x} ${l.y})`}
        />
      ))}
      {fruits.map((f, i) => (
        <circle
          key={`f-${i}`}
          cx={f.x}
          cy={f.y}
          r={6}
          fill={p.accent}
          className="fruit-glow"
        />
      ))}
    </>
  );
}

/* ─── Bamboo ────────────────────────────────────────────────── */

function Bamboo({ stage }: { stage: number }) {
  const p = getPlant("bamboo").palette;
  const canes = Math.min(5, 1 + stage);
  const height = 50 + stage * 22;

  return (
    <>
      {Array.from({ length: canes }, (_, i) => {
        const x = 140 + (i - (canes - 1) / 2) * 18;
        const h = height - Math.abs(i - Math.floor(canes / 2)) * 12;
        const segs = 3 + Math.min(stage, 3);
        const segH = h / segs;
        return (
          <g key={i}>
            {Array.from({ length: segs }, (_, s) => {
              const y1 = 220 - s * segH;
              const y2 = 220 - (s + 1) * segH;
              return (
                <g key={s}>
                  <rect
                    x={x - 5}
                    y={y2}
                    width={10}
                    height={segH - 1}
                    rx={3}
                    fill={s % 2 ? p.trunkA : p.trunkB}
                    opacity={0.95}
                  />
                  <line
                    x1={x - 6}
                    y1={y2}
                    x2={x + 6}
                    y2={y2}
                    stroke={p.trunkB}
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
            {stage >= 1 &&
              Array.from({ length: 2 + stage }, (_, li) => {
                const side = li % 2 === 0 ? -1 : 1;
                const ly = 220 - height * 0.35 - li * 10;
                return (
                  <ellipse
                    key={li}
                    cx={x + side * 14}
                    cy={ly}
                    rx={12 + stage}
                    ry={4}
                    fill={li % 2 ? p.leafA : p.leafB}
                    className="leaf-pop"
                    transform={`rotate(${side * 25} ${x + side * 14} ${ly})`}
                  />
                );
              })}
          </g>
        );
      })}
      {stage === 0 && (
        <ellipse cx="140" cy="200" rx="10" ry="5" fill={p.leafA} />
      )}
    </>
  );
}

/* ─── Maple ─────────────────────────────────────────────────── */

function MapleTree({ stage }: { stage: number }) {
  const p = getPlant("maple").palette;
  const trunkHeight = 36 + stage * 15;
  const baseY = 220 - trunkHeight;

  const leaves = useMemo(() => {
    const count = [1, 3, 6, 10, 14, 18][stage];
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 1.8 - 0.9;
      const radius = 20 + (i % 5) * 8 + stage * 5;
      return {
        x: 142 + Math.cos(angle) * radius,
        y: baseY - 5 - Math.sin(angle) * radius * 0.75,
        rot: (i * 40) % 360,
        scale: 0.7 + (i % 3) * 0.15,
      };
    });
  }, [stage, baseY]);

  return (
    <>
      <path
        d={`M132 220 C130 ${220 - trunkHeight * 0.5}, 134 ${baseY + 20}, 140 ${baseY}
            L148 ${baseY}
            C154 ${baseY + 20}, 150 ${220 - trunkHeight * 0.5}, 148 220 Z`}
        fill={p.trunkA}
      />
      {stage >= 2 && (
        <>
          <path
            d={`M142 ${baseY + 25} Q115 ${baseY}, 95 ${baseY + 8}`}
            stroke={p.trunkB}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M145 ${baseY + 30} Q175 ${baseY + 5}, 200 ${baseY + 12}`}
            stroke={p.trunkB}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {leaves.map((l, i) => (
        <g
          key={i}
          className="leaf-pop"
          transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.scale})`}
        >
          {/* simplified maple leaf */}
          <path
            d="M0 8 L-3 0 L-10 -2 L-3 -4 L-6 -12 L0 -6 L6 -12 L3 -4 L10 -2 L3 0 Z"
            fill={i % 3 === 0 ? p.leafA : i % 3 === 1 ? p.leafB : p.leafC}
          />
        </g>
      ))}
    </>
  );
}

/* ─── Sakura ────────────────────────────────────────────────── */

function SakuraTree({ stage }: { stage: number }) {
  const p = getPlant("sakura").palette;
  const trunkHeight = 38 + stage * 14;
  const baseY = 220 - trunkHeight;

  const blossoms = useMemo(() => {
    const count = [2, 4, 8, 12, 18, 24][stage];
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 1.7 - 0.85;
      const radius = 22 + (i % 5) * 9 + stage * 4;
      return {
        x: 142 + Math.cos(angle) * radius,
        y: baseY - Math.sin(angle) * radius * 0.8,
        r: 4 + (i % 3),
      };
    });
  }, [stage, baseY]);

  return (
    <>
      <path
        d={`M132 220 C130 ${220 - trunkHeight * 0.45}, 136 ${baseY + 15}, 140 ${baseY}
            L150 ${baseY}
            C154 ${baseY + 15}, 152 ${220 - trunkHeight * 0.45}, 148 220 Z`}
        fill={p.trunkA}
      />
      {stage >= 2 && (
        <>
          <path
            d={`M142 ${baseY + 22} Q112 ${baseY - 5}, 88 ${baseY + 5}`}
            stroke={p.trunkB}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M146 ${baseY + 28} Q178 ${baseY}, 205 ${baseY + 10}`}
            stroke={p.trunkB}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {stage >= 3 && (
        <>
          <path
            d={`M140 ${baseY + 10} Q125 ${baseY - 25}, 110 ${baseY - 30}`}
            stroke={p.trunkB}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M148 ${baseY + 12} Q165 ${baseY - 22}, 185 ${baseY - 28}`}
            stroke={p.trunkB}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      )}
      {blossoms.map((b, i) => (
        <g key={i} className="leaf-pop">
          {/* 5-petal blossom */}
          {[0, 72, 144, 216, 288].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const px = b.x + Math.cos(rad) * b.r * 0.7;
            const py = b.y + Math.sin(rad) * b.r * 0.7;
            return (
              <ellipse
                key={deg}
                cx={px}
                cy={py}
                rx={b.r * 0.55}
                ry={b.r * 0.35}
                fill={i % 2 ? p.leafA : p.leafB}
                opacity={0.92}
                transform={`rotate(${deg} ${px} ${py})`}
              />
            );
          })}
          <circle cx={b.x} cy={b.y} r={b.r * 0.28} fill={p.accent} />
        </g>
      ))}
      {stage >= 5 &&
        Array.from({ length: 8 }, (_, i) => (
          <ellipse
            key={`petal-${i}`}
            cx={90 + i * 14}
            cy={200 + (i % 3) * 8}
            rx={4}
            ry={2.5}
            fill={p.leafA}
            opacity={0.55}
            transform={`rotate(${20 + i * 15} ${90 + i * 14} ${200 + (i % 3) * 8})`}
          />
        ))}
    </>
  );
}

/* ─── Pine ──────────────────────────────────────────────────── */

function PineTree({ stage }: { stage: number }) {
  const p = getPlant("pine").palette;
  const layers = 1 + stage;
  const trunkH = 30 + stage * 10;

  return (
    <>
      <rect
        x="134"
        y={220 - trunkH}
        width="12"
        height={trunkH}
        rx="2"
        fill={p.trunkA}
      />
      {Array.from({ length: layers }, (_, i) => {
        const w = 28 + i * 12 + stage * 4;
        const y = 220 - trunkH - 10 - i * (18 + stage);
        return (
          <polygon
            key={i}
            points={`${140 - w},${y + 28} ${140},${y} ${140 + w},${y + 28}`}
            fill={i % 2 ? p.leafA : p.leafB}
            className="leaf-pop"
            opacity={0.95}
          />
        );
      })}
      {stage >= 4 && (
        <circle cx="148" cy={220 - trunkH - layers * 16} r="4" fill={p.accent} />
      )}
    </>
  );
}

/* ─── Willow ────────────────────────────────────────────────── */

function WillowTree({ stage }: { stage: number }) {
  const p = getPlant("willow").palette;
  const trunkHeight = 45 + stage * 12;
  const baseY = 220 - trunkHeight;
  const strands = 4 + stage * 2;

  return (
    <>
      <path
        d={`M136 220 C134 ${220 - trunkHeight * 0.5}, 138 ${baseY + 10}, 142 ${baseY}
            L150 ${baseY}
            C152 ${baseY + 10}, 150 ${220 - trunkHeight * 0.5}, 148 220 Z`}
        fill={p.trunkA}
      />
      {stage >= 1 && (
        <ellipse
          cx="145"
          cy={baseY - 5}
          rx={20 + stage * 6}
          ry={12 + stage * 3}
          fill={p.leafB}
          opacity={0.5}
        />
      )}
      {Array.from({ length: strands }, (_, i) => {
        const startX = 120 + i * (40 / Math.max(strands - 1, 1));
        const droop = 40 + stage * 12 + (i % 3) * 8;
        return (
          <path
            key={i}
            d={`M${startX} ${baseY} Q${startX - 8 + (i % 2) * 16} ${baseY + droop * 0.5}, ${startX + (i % 2 ? 6 : -6)} ${baseY + droop}`}
            stroke={i % 2 ? p.leafA : p.leafC}
            strokeWidth={2 + (stage > 3 ? 1 : 0)}
            fill="none"
            strokeLinecap="round"
            opacity={0.85}
            className="leaf-pop"
          />
        );
      })}
    </>
  );
}

/* ─── Bonsai ────────────────────────────────────────────────── */

function BonsaiTree({ stage }: { stage: number }) {
  const p = getPlant("bonsai").palette;
  // compact tree above pot rim (~210)
  const trunkTop = 210 - (28 + stage * 10);

  return (
    <>
      <path
        d={`M138 210 C120 ${210 - 20}, 125 ${trunkTop + 20}, 135 ${trunkTop}
            L145 ${trunkTop}
            C155 ${trunkTop + 15}, 160 ${210 - 25}, 150 210 Z`}
        fill={p.trunkA}
      />
      {stage >= 2 && (
        <path
          d={`M140 ${trunkTop + 15} Q115 ${trunkTop + 5}, 105 ${trunkTop + 18}`}
          stroke={p.trunkB}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {stage >= 1 && (
        <ellipse
          cx="138"
          cy={trunkTop - 5}
          rx={16 + stage * 5}
          ry={12 + stage * 3}
          fill={p.leafB}
          className="leaf-pop"
        />
      )}
      {stage >= 3 && (
        <ellipse
          cx="115"
          cy={trunkTop + 12}
          rx={12 + stage * 2}
          ry={9 + stage}
          fill={p.leafA}
          className="leaf-pop"
        />
      )}
      {stage >= 4 && (
        <ellipse
          cx="160"
          cy={trunkTop + 8}
          rx={10 + stage}
          ry={8}
          fill={p.leafC}
          className="leaf-pop"
        />
      )}
      {stage >= 5 && (
        <>
          <circle cx="130" cy={trunkTop - 8} r="3" fill={p.accent} className="fruit-glow" />
          <circle cx="145" cy={trunkTop} r="3" fill={p.accent} className="fruit-glow" />
        </>
      )}
    </>
  );
}

/* ─── Sunflower ─────────────────────────────────────────────── */

function Sunflower({ stage }: { stage: number }) {
  const p = getPlant("sunflower").palette;
  const stemH = 40 + stage * 18;
  const topY = 220 - stemH;
  const bloomR = stage < 3 ? 0 : 10 + (stage - 3) * 8;
  const petalCount = stage < 3 ? 0 : 8 + stage * 2;

  return (
    <>
      <rect
        x="136"
        y={topY}
        width="8"
        height={stemH}
        rx="3"
        fill={p.trunkA}
      />
      {stage >= 1 && (
        <>
          <ellipse
            cx="120"
            cy={220 - stemH * 0.5}
            rx={14 + stage * 2}
            ry={6}
            fill={p.leafA}
            transform={`rotate(-30 120 ${220 - stemH * 0.5})`}
            className="leaf-pop"
          />
          <ellipse
            cx="160"
            cy={220 - stemH * 0.4}
            rx={12 + stage * 2}
            ry={5}
            fill={p.leafB}
            transform={`rotate(35 160 ${220 - stemH * 0.4})`}
            className="leaf-pop"
          />
        </>
      )}
      {stage >= 2 && stage < 3 && (
        <ellipse cx="140" cy={topY} rx="8" ry="12" fill={p.leafB} className="leaf-pop" />
      )}
      {stage >= 3 && (
        <g className="leaf-pop">
          {Array.from({ length: petalCount }, (_, i) => {
            const deg = (i / petalCount) * 360;
            const rad = (deg * Math.PI) / 180;
            const px = 140 + Math.cos(rad) * bloomR * 1.15;
            const py = topY + Math.sin(rad) * bloomR * 1.15;
            return (
              <ellipse
                key={i}
                cx={px}
                cy={py}
                rx={bloomR * 0.55}
                ry={bloomR * 0.28}
                fill={p.accent}
                transform={`rotate(${deg} ${px} ${py})`}
              />
            );
          })}
          <circle cx="140" cy={topY} r={bloomR * 0.55} fill="#78350f" />
          <circle cx="140" cy={topY} r={bloomR * 0.35} fill="#a16207" />
        </g>
      )}
      {stage === 0 && (
        <ellipse cx="140" cy="200" rx="6" ry="4" fill={p.leafA} />
      )}
    </>
  );
}
