"use client";

import { useMemo, useState } from "react";
import type { Municipality } from "@/lib/types";
import { severityLabel } from "@/components/ui";

const riskTone: Record<Municipality["interventionPriority"], string> = {
  critical: "#c8503f",
  high: "#b98418",
  medium: "#245f91",
  watch: "#6f7d78",
  resolved: "#2c7a4b"
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scale(value: number, domain: [number, number], range: [number, number]) {
  const ratio = (value - domain[0]) / (domain[1] - domain[0] || 1);
  return range[0] + ratio * (range[1] - range[0]);
}

export function RiskAtlas({ municipalities }: { municipalities: Municipality[] }) {
  const [activeId, setActiveId] = useState(municipalities[0]?.id);
  const active = municipalities.find((municipality) => municipality.id === activeId) ?? municipalities[0];
  const points = useMemo(() => {
    const xValues = municipalities.map((municipality) => municipality.coordinates.x);
    const yValues = municipalities.map((municipality) => municipality.coordinates.y);
    const xDomain: [number, number] = [Math.min(...xValues), Math.max(...xValues)];
    const yDomain: [number, number] = [Math.min(...yValues), Math.max(...yValues)];

    return municipalities.map((municipality, index) => ({
      municipality,
      x: clamp(scale(municipality.coordinates.x, xDomain, [70, 500]), 56, 520),
      y: clamp(scale(municipality.coordinates.y, yDomain, [70, 260]), 54, 278),
      r: scale(municipality.ipi, [40, 100], [12, 24]),
      labelDy: index % 2 === 0 ? -24 : 33
    }));
  }, [municipalities]);

  return (
    <div className="risk-atlas">
      <svg viewBox="0 0 580 340" role="img" aria-label="Responsive pilot municipality risk atlas">
        <defs>
          <linearGradient id="atlasSurface" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fbf7" />
            <stop offset="58%" stopColor="#eef5ef" />
            <stop offset="100%" stopColor="#f9f3e7" />
          </linearGradient>
          <filter id="atlasShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#102820" floodOpacity="0.16" />
          </filter>
        </defs>
        <path
          className="atlas-province"
          d="M72 96 C130 44 218 38 294 58 C385 82 487 71 527 142 C566 211 497 285 398 302 C310 318 230 296 151 306 C83 315 39 264 53 193 C59 159 42 125 72 96 Z"
          fill="url(#atlasSurface)"
        />
        <path
          className="atlas-grid"
          d="M92 137 C177 100 268 100 354 132 C420 157 475 154 522 134 M79 206 C168 177 262 178 361 209 C420 227 474 225 531 197 M145 69 C154 143 156 217 133 297 M282 55 C285 127 286 227 281 310 M441 79 C417 151 419 230 445 291"
          fill="none"
        />
        {points.map(({ municipality, x, y, r, labelDy }) => {
          const isActive = municipality.id === active?.id;
          return (
            <g
              className={isActive ? "atlas-point active" : "atlas-point"}
              key={municipality.id}
              onFocus={() => setActiveId(municipality.id)}
              onMouseEnter={() => setActiveId(municipality.id)}
            >
              <a href={`/municipalities/${municipality.id}`} aria-label={`${municipality.commonName}: ${severityLabel[municipality.interventionPriority]}`}>
                <circle cx={x} cy={y} r={r + 8} fill="transparent" />
                <circle cx={x} cy={y} r={r} fill={riskTone[municipality.interventionPriority]} filter="url(#atlasShadow)" />
                <text x={x} y={y + 4} textAnchor="middle">
                  {municipality.commonName.slice(0, 3).toUpperCase()}
                </text>
              </a>
              <line x1={x} x2={x} y1={y + Math.sign(labelDy) * (r + 4)} y2={y + labelDy - Math.sign(labelDy) * 8} />
              <text className="atlas-label" x={x} y={y + labelDy} textAnchor="middle">
                {municipality.ipi}
              </text>
            </g>
          );
        })}
      </svg>
      {active ? (
        <div className="atlas-inspector">
          <span>{severityLabel[active.interventionPriority]} priority</span>
          <strong>{active.commonName}</strong>
          <p>{active.auditOutcome} / IPI {active.ipi} / {active.householdImpact}</p>
        </div>
      ) : null}
    </div>
  );
}
