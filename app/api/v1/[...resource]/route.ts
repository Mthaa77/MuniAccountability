import { NextResponse } from "next/server";
import { apiDatasets, apiResponse, getCaseFile, getMunicipality } from "@/lib/api";

type Context = {
  params: {
    resource?: string[];
  };
};

function notFound(resource: string[]) {
  return NextResponse.json(
    apiResponse(null, { resource: resource.join("/") }),
    {
      status: 404
    }
  );
}

export async function GET(request: Request, context: Context) {
  const resource = context.params.resource ?? [];
  const searchParams = new URL(request.url).searchParams;
  const [family, id, child] = resource;

  if (family === "municipalities" && !id) {
    const province = searchParams.get("province");
    const data = province
      ? apiDatasets.municipalities.filter((municipality) => municipality.province.toLowerCase() === province.toLowerCase())
      : apiDatasets.municipalities;

    return NextResponse.json(apiResponse(data, { province }));
  }

  if (family === "municipalities" && id && !child) {
    const municipality = getMunicipality(id);
    return municipality ? NextResponse.json(apiResponse(municipality, { id })) : notFound(resource);
  }

  if (family === "municipalities" && id && child === "case-file") {
    const caseFile = getCaseFile(id);
    return caseFile ? NextResponse.json(apiResponse(caseFile, { id })) : notFound(resource);
  }

  if (family === "municipalities" && id && child === "audit-history") {
    const municipality = getMunicipality(id);
    return municipality
      ? NextResponse.json(
          apiResponse(
            {
              municipalityId: id,
              outcome: municipality.auditOutcome,
              timeline: ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"].map((year) => ({
                year,
                outcome: municipality.auditOutcome,
                source: "agsa_mfma"
              }))
            },
            { id }
          )
        )
      : notFound(resource);
  }

  if (family === "municipalities" && id && child === "financial-pulse") {
    const municipality = getMunicipality(id);
    return municipality
      ? NextResponse.json(
          apiResponse(
            {
              municipalityId: id,
              status: "pending_validation",
              message: "Treasury/Municipal Money telemetry is reserved for Phase 2 validation.",
              metrics: municipality.metrics.filter((metric) => metric.id === "financial_pulse")
            },
            { id }
          )
        )
      : notFound(resource);
  }

  if (family === "municipalities" && id && child === "actions") {
    return NextResponse.json(
      apiResponse(apiDatasets.actions.filter((action) => action.municipalityId === id), { id })
    );
  }

  if (family === "municipalities" && id && child === "sources") {
    const municipality = getMunicipality(id);
    return municipality
      ? NextResponse.json(apiResponse(municipality.metrics.flatMap((metric) => metric.sources), { id }))
      : notFound(resource);
  }

  if (family === "intervention-queue") {
    return NextResponse.json(apiResponse(apiDatasets.queueItems));
  }

  if (family === "actions") {
    return NextResponse.json(apiResponse(apiDatasets.actions));
  }

  if (family === "risk-signals") {
    return NextResponse.json(apiResponse(apiDatasets.queueItems));
  }

  if (family === "intervention-priority-index") {
    return NextResponse.json(
      apiResponse(
        apiDatasets.municipalities.map((municipality) => ({
          municipalityId: municipality.id,
          municipality: municipality.name,
          score: municipality.ipi,
          calculationVersion: "agsa-first-v0.1",
          caveat: "Operational prioritisation aid, not a legal finding or corruption score."
        }))
      )
    );
  }

  if (family === "analytics" && id === "funding-at-risk") {
    return NextResponse.json(
      apiResponse({
        status: "pending_phase_2",
        message: "Funding-at-risk monitor is planned after Treasury telemetry validation.",
        gatedBy: ["source health", "reuse review", "formula versioning", "freshness SLA"]
      })
    );
  }

  if (family === "compare") {
    return NextResponse.json(apiResponse(apiDatasets.municipalities.slice(0, 4)));
  }

  if (family === "briefings") {
    return NextResponse.json(apiResponse({ briefings: apiDatasets.briefings, templates: apiDatasets.briefingTemplates }));
  }

  if (family === "assistant" && id === "query") {
    return NextResponse.json(
      apiResponse({
        answerPolicy: "Source-locked only",
        requiredAnswerParts: [
          "direct answer",
          "data coverage and period",
          "evidence citations",
          "filters/calculation",
          "confidence/completeness label",
          "suggested follow-up actions"
        ],
        refusalRule: "No source means no assertion."
      })
    );
  }

  if (family === "sources" || family === "data-freshness") {
    return NextResponse.json(apiResponse({ sources: apiDatasets.sourceHealth, events: apiDatasets.sourceFreshnessEvents }));
  }

  if (family === "recovery") {
    return NextResponse.json(apiResponse(apiDatasets.recoveryMilestones));
  }

  if (family === "municheck") {
    return NextResponse.json(apiResponse(apiDatasets.publicProfiles));
  }

  if (family === "munidata") {
    return NextResponse.json(apiResponse(apiDatasets.muniDataEndpoints));
  }

  if (family === "changes") {
    return NextResponse.json(
      apiResponse({
        since: searchParams.get("since"),
        changes: [
          {
            id: "chg_001",
            type: "pilot_seed",
            summary: "Static AGSA-first pilot data published.",
            changedAt: "2026-07-06T02:30:00+02:00"
          }
        ]
      })
    );
  }

  return notFound(resource);
}

export async function POST(request: Request, context: Context) {
  const body = await request.json().catch(() => ({}));
  const resource = context.params.resource ?? [];
  const [family, id, child] = resource;

  if (family === "actions" || family === "briefings" || family === "assistant") {
    return NextResponse.json(
      apiResponse({
        accepted: true,
        mode: "prototype",
        resource: resource.join("/"),
        received: body,
        note: "Prototype endpoint echoes accepted intent; production implementation must persist through tenant-scoped workflow services."
      }),
      { status: family === "assistant" && id === "query" ? 200 : 202 }
    );
  }

  if (family === "intervention-queue" && id && ["assign", "escalate"].includes(child ?? "")) {
    return NextResponse.json(
      apiResponse({
        accepted: true,
        queueItemId: id,
        operation: child,
        received: body
      }),
      { status: 202 }
    );
  }

  return notFound(resource);
}

export async function PATCH(request: Request, context: Context) {
  const body = await request.json().catch(() => ({}));
  const resource = context.params.resource ?? [];
  const [family, id] = resource;

  if (family === "actions" && id) {
    return NextResponse.json(
      apiResponse({
        accepted: true,
        actionId: id,
        received: body,
        note: "Prototype patch accepted; production requires audit log and transition validation."
      }),
      { status: 202 }
    );
  }

  return notFound(resource);
}
