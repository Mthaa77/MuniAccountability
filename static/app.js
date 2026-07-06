const source = {
  agsa: "AGSA verified · FY 2024-25",
  treasury: "Treasury pending validation"
};

const municipalities = [
  {
    id: "ZA_GP_EKU",
    name: "City of Ekurhuleni Metropolitan Municipality",
    common: "Ekurhuleni",
    outcome: "Unqualified with findings",
    severity: "critical",
    ipi: 86,
    impact: "High metro exposure",
    posture: "Executive decision required before next quarterly review",
    summary:
      "Metro governance and financial controls require executive oversight. AGSA reported metro regressions and financial distress indicators; Treasury telemetry remains gated until Phase 2 validation.",
    x: 69,
    y: 38,
    metrics: [
      ["Audit trajectory", "Regressed", "Ordered audit outcome movement based on AGSA outcome taxonomy.", source.agsa, "risk"],
      ["Financial pulse", "Pending", "Phase 2 Municipal Money telemetry after connector and reuse validation.", source.treasury, "watch"]
    ]
  },
  {
    id: "ZA_GP_JHB",
    name: "City of Johannesburg Metropolitan Municipality",
    common: "Johannesburg",
    outcome: "Unqualified with findings",
    severity: "high",
    ipi: 78,
    impact: "Major population and budget exposure",
    posture: "High-priority oversight with action evidence request",
    summary:
      "Audit and performance reporting weaknesses place Johannesburg in the high-priority review lane. Evidence review focuses on repeat findings, owner assignment and cited briefing outputs.",
    x: 52,
    y: 46,
    metrics: [["Repeat findings", "Active", "Repeat or unresolved finding categories that remain operationally relevant.", source.agsa, "risk"]]
  },
  {
    id: "ZA_GP_TSH",
    name: "City of Tshwane Metropolitan Municipality",
    common: "Tshwane",
    outcome: "Unqualified with findings",
    severity: "high",
    ipi: 74,
    impact: "Metro service-delivery exposure",
    posture: "Maintain high-priority monitoring and require updated evidence",
    summary:
      "Tshwane remains a high-priority case file for governance, compliance and action follow-through. Financial telemetry is clearly marked pending.",
    x: 45,
    y: 30,
    metrics: [["Corrective actions overdue", "2", "Open corrective actions past due date without accepted evidence.", source.agsa, "watch"]]
  },
  {
    id: "ZA_GP_MER",
    name: "Merafong City Local Municipality",
    common: "Merafong City",
    outcome: "Qualified with findings",
    severity: "medium",
    ipi: 61,
    impact: "Local municipality support case",
    posture: "Analyst review required",
    summary:
      "Merafong is suited to analyst review rather than immediate executive escalation. The case file highlights source-backed audit posture, actions and data quality needs.",
    x: 29,
    y: 61,
    metrics: [["Data quality", "Review", "Data steward review status for municipality mapping and source links.", source.agsa, "watch"]]
  }
];

const queue = [
  ["#1", "Ekurhuleni", "Metro regression requires executive decision", "AGSA metro regression context plus unresolved governance/action evidence risk.", "critical", "Approve executive evidence request and add to weekly intervention brief.", "Chief Director", "2026-07-13"],
  ["#2", "Johannesburg", "Repeat finding evidence not yet accepted", "Finding-to-action workflow has overdue evidence against a high-priority metro case.", "high", "Escalate to case manager and request corrected evidence.", "Oversight Analyst", "2026-07-11"],
  ["#3", "Tshwane", "Committee brief needs updated source pack", "Weekly briefing is missing a reviewed action status and source note.", "high", "Complete source review and generate executive briefing.", "Committee Researcher", "2026-07-10"],
  ["#4", "Merafong City", "Canonical municipality mapping review", "Data steward must confirm pilot mapping before publication.", "medium", "Review source references and publish or hold with reason.", "Data Steward", "2026-07-15"]
];

const actions = [
  ["Submit corrected governance action evidence", "Performance reporting and compliance controls", "Overdue", "Council-approved action plan · Implementation owner list · Evidence of review meeting", "risk"],
  ["Review repeat finding root-cause response", "Repeat accountability environment weakness", "Under review", "Root-cause response · Management sign-off · Reviewer notes", "watch"],
  ["Prepare weekly committee question pack", "High-priority oversight queue", "In progress", "Question pack · Source citations · Decision log draft", "neutral"]
];

const briefings = [
  ["Weekly Gauteng Intervention Brief", "Weekly intervention brief", "Decision required · What changed · Priority risks · Action owner status · Source notes", "Review"],
  ["Municipality 360 Executive Pack", "Municipality 360 executive brief", "Current situation · Audit posture · Evidence snapshot · Recommended next steps", "Draft"]
];

const sources = [
  ["AGSA MFMA consolidated report", "Phase 1 foundation source", "Healthy", "good"],
  ["Municipal Money / Treasury telemetry", "Do not display as live data until validation passes", "Unknown", "watch"],
  ["Institutional workflow data", "Internal only; never included in public MuniCheck", "Degraded", "risk"]
];

const severityLabel = { critical: "Critical", high: "High", medium: "Medium", watch: "Watch" };

function badge(text, tone) {
  return `<span class="badge ${tone}">${text}</span>`;
}

function render() {
  document.getElementById("metrics").innerHTML = [
    ["Municipalities requiring attention", "4", "One-province pilot cohort", "risk"],
    ["New critical risks", "1", "Since latest AGSA review", "risk"],
    ["Overdue corrective actions", "1", "Evidence not accepted", "watch"],
    ["Briefings in review", "1", "Weekly intervention brief", "neutral"],
    ["Published source coverage", "95%", "MVP target for audit fields", "good"]
  ]
    .map(([title, value, note, tone]) => `<article class="metric-card ${tone}"><span>${title}</span><strong>${value}</strong><p>${note}</p></article>`)
    .join("");

  document.getElementById("queueRows").innerHTML = queue
    .map(
      ([rank, muni, title, reason, severity, next, owner, due]) => `
      <tr>
        <td><strong>${rank}</strong></td>
        <td>${muni}</td>
        <td><strong>${title}</strong><span>${reason}</span></td>
        <td>${badge(severityLabel[severity], severity === "critical" ? "risk" : severity === "medium" ? "neutral" : "watch")}</td>
        <td>${next}</td>
        <td>${owner}</td>
        <td>${due}</td>
      </tr>`
    )
    .join("");

  document.getElementById("mapPoints").innerHTML = municipalities
    .map((m) => `<div class="map-point ${m.severity}" style="left:${m.x}%;top:${m.y}%"><span>${m.common.slice(0, 3).toUpperCase()}</span></div>`)
    .join("");

  document.getElementById("mapList").innerHTML = municipalities
    .map((m) => `<div><span>${m.common}</span>${badge(severityLabel[m.severity], m.severity === "critical" ? "risk" : m.severity === "medium" ? "neutral" : "watch")}</div>`)
    .join("");

  const selected = municipalities[0];
  document.getElementById("caseName").textContent = selected.common;
  document.getElementById("caseSeverity").textContent = severityLabel[selected.severity];
  document.getElementById("caseSummary").textContent = selected.summary;
  document.getElementById("caseMeta").innerHTML = [selected.outcome, selected.impact, selected.posture].map((item) => `<span>${item}</span>`).join("");
  document.getElementById("ipiScore").textContent = selected.ipi;
  document.getElementById("ipiBar").style.width = `${selected.ipi}%`;
  document.getElementById("caseMetrics").innerHTML = selected.metrics
    .map(
      ([label, value, definition, src, tone]) => `
      <article>
        <div><span>${label}</span><strong>${value}</strong></div>
        ${badge(src, tone)}
        <p>${definition}</p>
      </article>`
    )
    .join("");

  const first = queue[0];
  document.getElementById("evidenceList").innerHTML = [
    ["Risk signal", "audit"],
    ["What changed", "Moved into critical lane after FY 2024-25 review pack."],
    ["Required action", first[5]],
    ["Source", source.agsa]
  ]
    .map(([term, detail]) => `<div><dt>${term}</dt><dd>${detail}</dd></div>`)
    .join("");

  document.getElementById("actions").innerHTML = actions
    .map(([title, finding, status, evidence, tone]) => `<article><div><strong>${title}</strong><span>${finding}</span></div>${badge(status, tone)}<p>${evidence}</p></article>`)
    .join("");

  document.getElementById("briefingsList").innerHTML = briefings
    .map(([title, template, sections, status]) => `<article><strong>${title}</strong><span>${template}</span><p>${sections}</p>${badge(status, status === "Review" ? "watch" : "neutral")}</article>`)
    .join("");

  document.getElementById("sourceHealth").innerHTML = sources
    .map(([title, treatment, status, tone]) => `<article><div><strong>${title}</strong><span>${treatment}</span></div>${badge(status, tone)}</article>`)
    .join("");
}

render();
