"use client";

import Link from "next/link";
import { Bot, CheckCircle2, ExternalLink, LockKeyhole, MessageSquareText, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { apiPost } from "@/lib/client-api";

type AssistantCitation = {
  id?: string;
  label?: string;
  source?: string;
  location?: string;
  period?: string;
  url?: string;
};

type AssistantResult = {
  id: string;
  type: string;
  title: string;
  summary: string;
  confidence: "high" | "medium" | "low" | "needs_review" | string;
  publicationState?: string;
  path?: string;
  period?: string;
};

type AssistantAnswer = {
  answer: string | null;
  confidence: "unsupported" | "partial_review_required" | "source_backed" | string;
  refusal?: string;
  coverage?: {
    source?: string;
    periods?: string[];
    resultTypes?: string[];
  };
  citations?: AssistantCitation[];
  results?: AssistantResult[];
  filtersAndCalculation?: string;
  suggestedFollowUpActions?: string[];
  refusalRule?: string;
  requiredAnswerParts?: string[];
};

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  question?: string;
  answer?: AssistantAnswer;
};

const starterPrompts = [
  "Why is this municipality high risk?",
  "What evidence supports irregular expenditure?",
  "Which claims still need review?",
  "What can be safely published?"
];

function confidenceLabel(confidence?: string) {
  if (confidence === "source_backed") return "Source-backed";
  if (confidence === "partial_review_required") return "Needs review";
  if (confidence === "unsupported") return "Unsupported";
  return confidence?.replaceAll("_", " ") ?? "Evidence mode";
}

function confidenceTone(confidence?: string) {
  if (confidence === "source_backed") return "good";
  if (confidence === "partial_review_required") return "watch";
  if (confidence === "unsupported") return "risk";
  return "neutral";
}

export function FreeAssistant() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const latestAnswer = useMemo(() => turns.findLast((turn) => turn.role === "assistant")?.answer, [turns]);

  async function askAssistant(question: string) {
    const cleaned = question.trim();
    if (!cleaned || loading) return;

    const userTurn: ChatTurn = { id: `user_${Date.now()}`, role: "user", question: cleaned };
    setTurns((current) => [...current, userTurn]);
    setQuery("");
    setLoading(true);

    try {
      const payload = await apiPost<AssistantAnswer>("/v1/assistant/query", { query: cleaned, mode: "evidence" });
      const assistantTurn: ChatTurn = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        answer: payload.data
      };
      setTurns((current) => [...current, assistantTurn]);
    } catch {
      setTurns((current) => [
        ...current,
        {
          id: `assistant_error_${Date.now()}`,
          role: "assistant",
          answer: {
            answer: null,
            confidence: "unsupported",
            refusal: "The free assistant could not reach the evidence endpoint. Try again after the backend is available.",
            refusalRule: "No source means no assertion."
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askAssistant(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askAssistant(query);
    }
  }

  function openAssistant() {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  }

  return (
    <>
      <button className="assistant-float-button" aria-label="Open Ask MuniAtlas assistant" onClick={openAssistant}>
        <Bot size={18} />
        <span>Ask MuniAtlas</span>
      </button>

      {open ? (
        <aside className="assistant-drawer" aria-label="Ask MuniAtlas source-locked assistant">
          <div className="assistant-shell-card">
            <header className="assistant-header">
              <div className="assistant-brand-orb">
                <Bot size={20} />
              </div>
              <div>
                <p className="eyeless">Free source-locked assistant</p>
                <h2>Ask MuniAtlas</h2>
                <span>Evidence Mode uses your backend data only. No paid AI credits.</span>
              </div>
              <button className="assistant-close" aria-label="Close assistant" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </header>

            <section className="assistant-mode-panel" aria-label="Assistant mode">
              <div className="assistant-mode active">
                <ShieldCheck size={17} />
                <div>
                  <strong>Evidence Mode</strong>
                  <span>Free, source-locked and safe for MVP</span>
                </div>
              </div>
              <div className="assistant-mode locked">
                <LockKeyhole size={17} />
                <div>
                  <strong>Analyst Mode</strong>
                  <span>Paid AI upgrade later</span>
                </div>
              </div>
            </section>

            {latestAnswer ? (
              <section className="assistant-summary-strip">
                <span className={`assistant-confidence tone-${confidenceTone(latestAnswer.confidence)}`}>
                  {confidenceLabel(latestAnswer.confidence)}
                </span>
                <span>{latestAnswer.coverage?.source ?? "Local AGSA evidence"}</span>
                <span>{latestAnswer.citations?.length ?? 0} citation(s)</span>
              </section>
            ) : null}

            <div className="assistant-thread" aria-live="polite">
              {!turns.length ? (
                <section className="assistant-empty-state">
                  <div>
                    <Sparkles size={22} />
                  </div>
                  <h3>Ask a question before you make a claim.</h3>
                  <p>The assistant searches the AGSA evidence library and refuses unsupported answers. It is intentionally strict, like a tiny evidence librarian with a velvet clipboard.</p>
                  <div className="assistant-prompts">
                    {starterPrompts.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => askAssistant(prompt)}>{prompt}</button>
                    ))}
                  </div>
                </section>
              ) : null}

              {turns.map((turn) => (
                <article className={`assistant-turn ${turn.role}`} key={turn.id}>
                  {turn.role === "user" ? (
                    <>
                      <span>You asked</span>
                      <p>{turn.question}</p>
                    </>
                  ) : turn.answer ? (
                    <>
                      <div className="assistant-answer-topline">
                        <span className={`assistant-confidence tone-${confidenceTone(turn.answer.confidence)}`}>
                          {confidenceLabel(turn.answer.confidence)}
                        </span>
                        <span>{turn.answer.refusalRule ?? "No source means no assertion."}</span>
                      </div>

                      {turn.answer.answer ? <p>{turn.answer.answer}</p> : <p className="assistant-refusal">{turn.answer.refusal}</p>}

                      {turn.answer.coverage ? (
                        <div className="assistant-coverage-grid">
                          <div>
                            <span>Source</span>
                            <strong>{turn.answer.coverage.source ?? "AGSA corpus"}</strong>
                          </div>
                          <div>
                            <span>Periods</span>
                            <strong>{turn.answer.coverage.periods?.join(", ") || "Not specified"}</strong>
                          </div>
                          <div>
                            <span>Result types</span>
                            <strong>{turn.answer.coverage.resultTypes?.map((type) => type.replaceAll("_", " ")).join(", ") || "None"}</strong>
                          </div>
                        </div>
                      ) : null}

                      {turn.answer.citations?.length ? (
                        <section className="assistant-citation-stack">
                          <h3>Citations</h3>
                          {turn.answer.citations.map((citation) => (
                            <Link href={citation.url ?? "/sources"} key={`${citation.id}-${citation.location}`}>
                              <CheckCircle2 size={16} />
                              <span>
                                <strong>{citation.label ?? citation.source ?? "Source"}</strong>
                                <small>{citation.location ?? citation.period ?? "Open source"}</small>
                              </span>
                              <ExternalLink size={14} />
                            </Link>
                          ))}
                        </section>
                      ) : null}

                      {turn.answer.results?.length ? (
                        <section className="assistant-result-stack">
                          <h3>Evidence found</h3>
                          {turn.answer.results.slice(0, 4).map((result) => (
                            <Link href={result.path ?? "/sources"} key={`${result.type}-${result.id}`}>
                              <span>{result.type.replaceAll("_", " ")}</span>
                              <strong>{result.title}</strong>
                              <small>{result.summary}</small>
                            </Link>
                          ))}
                        </section>
                      ) : null}

                      {turn.answer.suggestedFollowUpActions?.length ? (
                        <section className="assistant-followups">
                          <h3>Suggested next steps</h3>
                          {turn.answer.suggestedFollowUpActions.map((action) => <span key={action}>{action}</span>)}
                        </section>
                      ) : null}
                    </>
                  ) : null}
                </article>
              ))}

              {loading ? (
                <article className="assistant-turn assistant loading">
                  <div className="assistant-thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                  <p>Checking the source library before answering...</p>
                </article>
              ) : null}
            </div>

            <form className="assistant-compose" onSubmit={onSubmit}>
              <label htmlFor="assistant-query">Ask a source-backed question</label>
              <div>
                <textarea
                  id="assistant-query"
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about a municipality, finding, risk, source or public claim..."
                  rows={3}
                />
                <button className="primary-action" type="submit" disabled={loading || !query.trim()}>
                  <Search size={16} />
                  Ask
                </button>
              </div>
            </form>
          </div>
        </aside>
      ) : null}
    </>
  );
}
