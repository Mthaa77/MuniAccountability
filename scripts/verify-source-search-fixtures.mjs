import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const extract = JSON.parse(fs.readFileSync(path.join(root, "data", "agsa", "generated", "agsa-report-extract.json"), "utf8"));
const searchSource = fs.readFileSync(path.join(root, "lib", "source-search.ts"), "utf8");
const apiRoute = fs.readFileSync(path.join(root, "app", "api", "v1", "[...resource]", "route.ts"), "utf8");
const muniCheckDetail = fs.readFileSync(path.join(root, "app", "municheck", "[municipalityId]", "page.tsx"), "utf8");
const muniDataCatalog = fs.readFileSync(path.join(root, "lib", "agsa-data.ts"), "utf8");

const citationsById = new Map(extract.pageCitations.map((citation) => [citation.citationId, citation]));

function searchFixture(query) {
  const terms = query.toLowerCase().split(/\W+/).filter((term) => term.length > 2);
  return extract.findings.filter((finding) => {
    const text = `${finding.subtheme} ${finding.description} ${finding.impact} ${finding.findingFamily}`.toLowerCase();
    return terms.some((term) => text.includes(term)) && citationsById.has(finding.citationId);
  });
}

const irregularResults = searchFixture("irregular expenditure");
assert(irregularResults.length > 0, "Fixture search should find irregular expenditure evidence.");
assert(irregularResults.every((finding) => citationsById.has(finding.citationId)), "Every fixture search result must retain a page citation.");

assert(searchSource.includes("No AGSA source in the current corpus supports that answer"), "Assistant grounding must include a no-source refusal.");
assert(searchSource.includes("searchAgsaEvidence"), "Source search module should export searchAgsaEvidence.");
assert(searchSource.includes("answerSourceLockedQuery"), "Source search module should export answerSourceLockedQuery.");

assert(apiRoute.includes('family === "search"'), "API route should expose /v1/search.");
assert(apiRoute.includes("answerSourceLockedQuery(query)"), "POST /v1/assistant/query should use source-locked answers.");
assert(apiRoute.includes("getPublicMuniCheckProfile(id)"), "API route should expose public MuniCheck detail records.");

assert(muniCheckDetail.includes("Public MuniCheck profile"), "MuniCheck detail page should render a public profile.");
assert(muniCheckDetail.includes("What this page excludes"), "MuniCheck detail page should declare hidden-field exclusions.");

assert(muniDataCatalog.includes("/v1/search?q={query}"), "MuniData should document source search.");
assert(muniDataCatalog.includes("/v1/municheck/{id}"), "MuniData should document public MuniCheck detail.");
assert(muniDataCatalog.includes("unsupported questions return no-assertion refusal"), "MuniData should document assistant refusal behavior.");

console.log(`Source search fixture verified: ${irregularResults.length} irregular expenditure finding(s) with citations.`);
