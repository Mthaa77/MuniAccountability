import { NextResponse } from "next/server";
import { apiDatasets, apiResponse, getCaseFile, getMunicipality } from "@/lib/api";
import {
  getAgsaReviewGovernance,
  getDecisionForCitation,
  isCitationPublicSafe,
  listAgsaReviewDecisions,
  saveAgsaReviewDecision
} from "@/lib/agsa-review-store";
import { listDraftActions, patchDraftAction, saveDraftAction } from "@/lib/draft-action-store";
import { getFindingDetail } from "@/lib/pilot-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function governedSourcePayload() {
  const governance = getAgsaReviewGovernance(apiDatasets.extractionIssues.length);
  const sources = apiDatasets.sourceHealth.map((source) => {
    if (source.sourceId !== "agsa_corpus" && source.sourceId !== "agsa_extraction") return source;

    return {
      ...source,
      status: governance.stats.blockers ? "degraded" : governance.stats.open ? "degraded" : "healthy",
      openExceptions: governance.stats.open + governance.stats.blockers,
      reviewStats: governance.stats,
      treatment:
        governance.stats.blockers > 0
          ? "Review blockers require correction before derived assertions are published"
          : source.treatment
    };
  });
  const events = [
    ...apiDatasets.sourceFreshnessEvents,
    {
      sourceId: "agsa_review",
      event: `${governance.stats.accepted} accepted, ${governance.stats.correction} correction, ${governance.stats.excluded} excluded review decision(s)`,
      status: governance.stats.blockers ? "degraded" : "healthy",
      date: governance.updatedAt
    }
  ];

  return { sources, events, review: governance.stats };
}

function publicSafeProfiles() {
  return apiDatasets.publicProfiles
    .filter((profile) => !profile.citation?.id || isCitationPublicSafe(profile.citation.id))
    .map((profile) => ({
      municipalityId: profile.municipalityId,
      name: profile.name,
      plainLanguageStatus: profile.plainLanguageStatus,
      auditOutcome: profile.auditOutcome,
      sourcePeriod: profile.sourcePeriod,
      citation: profile.citation,
      publicFields: profile.publicFields,
      methodology: [
        "AGSA source-published evidence only.",
        "Platform priority scores are workflow aids, not legal findings.",
        "Treasury telemetry remains pending validation."
      ],
      reviewStatus: profile.citation?.id ? getDecisionForCitation(profile.citation.id)?.status ?? "not_reviewed" : "not_reviewed"
    }));
}

function findingWithGovernance(findingId: string) {
  const detail = getFindingDetail(findingId);
  if (!detail) return null;
  const reviewDecision = getDecisionForCitation(detail.citationId);

  return {
    ...detail,
    reviewStatus: reviewDecision?.status ?? "not_reviewed",
    reviewDecision
  };
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
              timeline: apiDatasets.auditTimelines[id] ?? []
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
    const drafts = listDraftActions().actions.filter((action) => action.municipalityId === id);
    return NextResponse.json(
      apiResponse([...apiDatasets.actions.filter((action) => action.municipalityId === id), ...drafts], { id })
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
    if (id === "drafts" && !child) {
      return NextResponse.json(apiResponse(listDraftActions()));
    }

    return NextResponse.json(apiResponse(apiDatasets.actions));
  }

  if (family === "agsa" && id === "documents") {
    if (child) {
      const document = apiDatasets.getSourceDocumentDetail(child);
      return document ? NextResponse.json(apiResponse(document, { id: child })) : notFound(resource);
    }

    return NextResponse.json(apiResponse(apiDatasets.agsaDocuments));
  }

  if (family === "agsa" && id === "findings") {
    return NextResponse.json(apiResponse(apiDatasets.agsaFindings));
  }

  if (family === "agsa" && id === "outcomes") {
    return NextResponse.json(apiResponse(apiDatasets.mappedAuditOutcomes));
  }

  if (family === "agsa" && id === "citations") {
    return NextResponse.json(apiResponse(apiDatasets.agsaPageCitations));
  }

  if (family === "agsa" && id === "extraction-issues") {
    return NextResponse.json(apiResponse(apiDatasets.extractionIssues));
  }

  if (family === "agsa" && id === "extract") {
    return NextResponse.json(apiResponse(apiDatasets.agsaExtract));
  }

  if (family === "initiatives") {
    const initiativeType = searchParams.get("type");
    const data = initiativeType
      ? apiDatasets.agsaInitiatives.filter((initiative) => initiative.initiativeType === initiativeType)
      : apiDatasets.agsaInitiatives;

    return NextResponse.json(apiResponse(data, { type: initiativeType }));
  }

  if (family === "material-irregularities") {
    return NextResponse.json(apiResponse(apiDatasets.agsaMaterialIrregularities));
  }

  if (family === "recommendations") {
    return NextResponse.json(apiResponse(apiDatasets.agsaRecommendations));
  }

  if (family === "findings" && !id) {
    return NextResponse.json(
      apiResponse(
        apiDatasets.agsaFindings.map((finding) => ({
          ...finding,
          detailPath: `/findings/${finding.findingId}`,
          reviewStatus: getDecisionForCitation(finding.citationId)?.status ?? "not_reviewed"
        }))
      )
    );
  }

  if (family === "findings" && id) {
    const finding = findingWithGovernance(id);
    return finding ? NextResponse.json(apiResponse(finding, { id })) : notFound(resource);
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

  if (family === "agsa" && id === "review-decisions") {
    return NextResponse.json(apiResponse(listAgsaReviewDecisions()));
  }

  if (family === "sources" || family === "data-freshness") {
    return NextResponse.json(apiResponse(governedSourcePayload()));
  }

  if (family === "recovery") {
    return NextResponse.json(apiResponse(apiDatasets.recoveryMilestones));
  }

  if (family === "municheck") {
    return NextResponse.json(apiResponse(publicSafeProfiles()));
  }

  if (family === "munidata") {
    return NextResponse.json(
      apiResponse({
        endpoints: apiDatasets.muniDataEndpoints,
        reviewAware: true,
        schemas: ["agsa-extract-v0.1", "agsa-review-decisions-v0.1", "draft-actions-v0.1"],
        caveats: [
          "AGSA records are extracted from local docs/ reports with page citations and confidence flags.",
          "Platform risk scores are workflow prioritisation aids, not legal findings.",
          "Treasury/Municipal Money telemetry is marked pending validation and is not presented as live."
        ]
      })
    );
  }

  if (family === "changes") {
    return NextResponse.json(
      apiResponse({
        since: searchParams.get("since"),
        changes: [
          {
            id: "chg_001",
            type: "agsa_extract",
            summary: "AGSA PDF extract published as the platform data backbone.",
            changedAt: apiDatasets.agsaExtract.generatedAt
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

  if (family === "actions" && id === "drafts") {
    try {
      return NextResponse.json(apiResponse(saveDraftAction(body)), { status: 201 });
    } catch (error) {
      return NextResponse.json(
        apiResponse({
          accepted: false,
          error: error instanceof Error ? error.message : "Invalid draft action payload"
        }),
        { status: 400 }
      );
    }
  }

  if (family === "agsa" && id === "review-decisions") {
    try {
      return NextResponse.json(apiResponse(saveAgsaReviewDecision(body)), { status: 201 });
    } catch (error) {
      return NextResponse.json(
        apiResponse({
          accepted: false,
          error: error instanceof Error ? error.message : "Invalid review decision payload"
        }),
        { status: 400 }
      );
    }
  }

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
  const [family, id, child] = resource;

  if (family === "actions" && id === "drafts" && child) {
    try {
      return NextResponse.json(apiResponse(patchDraftAction(child, body)), { status: 202 });
    } catch (error) {
      return NextResponse.json(
        apiResponse({
          accepted: false,
          error: error instanceof Error ? error.message : "Invalid draft action update"
        }),
        { status: 404 }
      );
    }
  }

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
