"use client";

import { useState, useCallback, useRef } from "react";
import { saveAs } from "file-saver";
import { generateBusinessCase, BusinessCaseData, StrategicObjective } from "@/lib/generateDocx";
import {
  FileText, Download, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, Sparkles, Wand2, Zap, X
} from "lucide-react";

const DEFAULT_OBJECTIVES: StrategicObjective[] = [
  { label: "Loyal Customer Base", checked: false, explanation: "" },
  { label: "Lifetime Value", checked: false, explanation: "" },
  { label: "New Revenue Streams", checked: false, explanation: "" },
  { label: "1st Party Data", checked: false, explanation: "" },
];

const STEPS = [
  { id: 0, label: "Identity" },
  { id: 1, label: "Summary" },
  { id: 2, label: "Strategy" },
  { id: 3, label: "Value" },
  { id: 4, label: "Outcomes" },
];

const FIELD_LABELS: Record<string, string> = {
  execSummary: "Executive Summary",
  strategicRationale: "Strategic Rationale",
  objective: "Objective",
  valueProposition: "Value Proposition",
  expectedOutcomes: "Expected Outcomes",
};

export default function Home() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [draftingField, setDraftingField] = useState<string | null>(null);
  const [quickGenOpen, setQuickGenOpen] = useState(false);
  const [quickGenBrief, setQuickGenBrief] = useState("");
  const [quickGenLoading, setQuickGenLoading] = useState(false);
  const [quickGenError, setQuickGenError] = useState("");
  const draftBriefRefs = useRef<Record<string, string>>({});

  const [formData, setFormData] = useState<BusinessCaseData>({
    caseName: "",
    caseOwner: "",
    execSummary: "",
    strategicRationale: "",
    objective: "",
    valueProposition: "",
    expectedOutcomes: "",
    objectives: DEFAULT_OBJECTIVES,
  });

  const update = useCallback((field: keyof BusinessCaseData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateObjective = useCallback((index: number, field: keyof StrategicObjective, value: boolean | string) => {
    setFormData((prev) => {
      const objectives = [...prev.objectives];
      objectives[index] = { ...objectives[index], [field]: value };
      return { ...prev, objectives };
    });
  }, []);

  const canProceed = useCallback(() => {
    if (step === 0) return formData.caseName.trim() && formData.caseOwner.trim();
    if (step === 1) return formData.execSummary.trim().length >= 10;
    if (step === 2) return formData.strategicRationale.trim().length >= 10;
    if (step === 3) return formData.objective.trim() && formData.valueProposition.trim().length >= 10;
    return formData.expectedOutcomes.trim().length >= 10;
  }, [step, formData]);

  // ── Quick Generate ───────────────────────────────────────────────────────
  const handleQuickGenerate = async () => {
    if (!quickGenBrief.trim()) return;
    setQuickGenLoading(true);
    setQuickGenError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: quickGenBrief,
          caseName: formData.caseName,
          caseOwner: formData.caseOwner,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setFormData((prev) => ({
        ...prev,
        execSummary: data.execSummary ?? prev.execSummary,
        strategicRationale: data.strategicRationale ?? prev.strategicRationale,
        objective: data.objective ?? prev.objective,
        valueProposition: data.valueProposition ?? prev.valueProposition,
        expectedOutcomes: data.expectedOutcomes ?? prev.expectedOutcomes,
        objectives: prev.objectives.map((obj) => ({
          ...obj,
          checked: data.objectives?.[obj.label]?.checked ?? obj.checked,
          explanation: data.objectives?.[obj.label]?.explanation ?? obj.explanation,
        })),
      }));

      setQuickGenOpen(false);
      setQuickGenBrief("");
      setStep(1);
    } catch (err: unknown) {
      setQuickGenError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setQuickGenLoading(false);
    }
  };

  // ── Per-field streaming draft ────────────────────────────────────────────
  const handleDraftField = async (field: string) => {
    setDraftingField(field);
    const brief = draftBriefRefs.current[field] ?? "";
    let accumulated = "";

    try {
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, brief, caseName: formData.caseName }),
      });

      if (!res.ok) throw new Error("Draft request failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      setFormData((prev) => ({ ...prev, [field]: "" }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setFormData((prev) => ({ ...prev, [field]: snap }));
      }
    } catch (err) {
      console.error("Draft failed", err);
    } finally {
      setDraftingField(null);
    }
  };

  // ── Download docx ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const blob = await generateBusinessCase(formData);
      const safeName = formData.caseName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      saveAs(blob, `business_case_${safeName}.docx`);
      setGenerated(true);
      setTimeout(() => setGenerated(false), 4000);
    } catch (err) {
      console.error("Generation failed", err);
      alert("Something went wrong generating the document. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  const AIDraftButton = ({ field }: { field: string }) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      <input
        type="text"
        placeholder={`Optional brief to guide Claude for ${FIELD_LABELS[field]}…`}
        style={{ flex: 1, padding: "7px 12px", fontSize: 13 }}
        onChange={(e) => { draftBriefRefs.current[field] = e.target.value; }}
      />
      <button
        className="btn-secondary"
        onClick={() => handleDraftField(field)}
        disabled={draftingField === field}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          borderColor: "rgba(79,110,247,0.4)", color: "var(--accent)",
          whiteSpace: "nowrap", padding: "7px 14px", fontSize: 13,
        }}
      >
        {draftingField === field
          ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Drafting…</>
          : <><Wand2 size={13} /> Draft with AI</>}
      </button>
    </div>
  );

  return (
    <main style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>

      {/* ── Quick Generate modal ─────────────────────────────────────────── */}
      {quickGenOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 540, animation: "slideUp 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Quick Generate</h2>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 13 }}>
                  Describe your initiative in 1–3 sentences. Claude will fill every section.
                </p>
              </div>
              <button
                onClick={() => setQuickGenOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              rows={5}
              placeholder="e.g. We want to build a behavioural targeting pipeline that ingests Nirvana log data, maps it to IAB segments via Redis, and injects them into GAM at under 50ms latency to unlock CPM uplift across our programmatic stack."
              value={quickGenBrief}
              onChange={(e) => setQuickGenBrief(e.target.value)}
              style={{ marginBottom: 12 }}
              autoFocus
            />

            {quickGenError && (
              <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{quickGenError}</p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn-secondary" onClick={() => setQuickGenOpen(false)}>Cancel</button>
              <button
                className="btn-generate"
                onClick={handleQuickGenerate}
                disabled={!quickGenBrief.trim() || quickGenLoading}
                style={{ padding: "10px 22px", fontSize: 14 }}
              >
                {quickGenLoading
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating all sections…</>
                  : <><Sparkles size={14} /> Generate Full Case</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #4f6ef7, #6b4ef7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(79,110,247,0.35)", flexShrink: 0,
            }}>
              <FileText size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                Business Case Generator
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                FairPlay Sports Media · Template v1.0
              </p>
            </div>
          </div>
          <button
            className="btn-generate"
            onClick={() => setQuickGenOpen(true)}
            style={{ padding: "9px 16px", fontSize: 13, boxShadow: "none", flexShrink: 0 }}
          >
            <Zap size={14} /> Quick Generate
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
          {STEPS.map((s) => (
            <button
              key={s.id}
              className={`nav-dot ${step === s.id ? "active" : ""}`}
              onClick={() => s.id < step && setStep(s.id)}
              title={s.label}
              style={{ opacity: s.id > step ? 0.35 : 1 }}
            />
          ))}
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
            Step {step + 1} / {STEPS.length} — <strong style={{ color: "var(--text)" }}>{STEPS[step].label}</strong>
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ── Step 0: Identity ─────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="card" style={{ animation: "slideUp 0.3s ease" }}>
          <div className="section-tag">
            <span className="step-pill"><Sparkles size={12} /> Identity</span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
            These fields appear on the cover and document header. Once filled, use{" "}
            <strong style={{ color: "var(--accent)" }}>Quick Generate</strong> (top right) to have Claude draft all sections from a single brief.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label>Business Case Name</label>
              <input
                type="text"
                placeholder="e.g. Dynamic Odds DCO Banner Programme"
                value={formData.caseName}
                onChange={(e) => update("caseName", e.target.value)}
              />
            </div>
            <div>
              <label>Case Owner</label>
              <input
                type="text"
                placeholder="e.g. Dan Thornton"
                value={formData.caseOwner}
                onChange={(e) => update("caseOwner", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Executive Summary ────────────────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ animation: "slideUp 0.3s ease" }}>
          <div className="section-tag">
            <span className="step-pill">Executive Summary</span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
            Each line becomes a separate bullet point in the document.
          </p>
          <AIDraftButton field="execSummary" />
          <label>Executive Summary</label>
          <textarea
            rows={7}
            placeholder={"Brief overview of the proposal\nKey value proposition\nHigh-level summary of scope\nHigh-level summary of expected outcomes"}
            value={formData.execSummary}
            onChange={(e) => update("execSummary", e.target.value)}
          />
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
            💡 One point per line — each becomes a bullet in the generated doc.
          </p>
        </div>
      )}

      {/* ── Step 2: Strategy ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card" style={{ animation: "slideUp 0.3s ease" }}>
          <div className="section-tag">
            <span className="step-pill">Strategic Rationale</span>
          </div>
          <div style={{ marginBottom: 24 }}>
            <AIDraftButton field="strategicRationale" />
            <label>Strategic Rationale</label>
            <textarea
              rows={5}
              placeholder={"Primary business objectives\nMarket opportunity identification\nStrategic alignment with company goals"}
              value={formData.strategicRationale}
              onChange={(e) => update("strategicRationale", e.target.value)}
            />
          </div>
          <div className="card-inner">
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
              Strategic Alignment Objectives
            </p>
            {formData.objectives.map((obj, i) => (
              <div key={i} className="obj-row">
                <span className="obj-label">{obj.label}</span>
                <label className="toggle" title="Mark as applicable">
                  <input
                    type="checkbox"
                    checked={obj.checked}
                    onChange={(e) => updateObjective(i, "checked", e.target.checked)}
                  />
                  <span className="slider" />
                </label>
                <input
                  type="text"
                  placeholder={obj.checked ? "Explain how this applies…" : "N/A"}
                  value={obj.explanation}
                  disabled={!obj.checked}
                  style={{ opacity: obj.checked ? 1 : 0.4 }}
                  onChange={(e) => updateObjective(i, "explanation", e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Objective & Value Proposition ────────────────────────── */}
      {step === 3 && (
        <div className="card" style={{ animation: "slideUp 0.3s ease" }}>
          <div className="section-tag">
            <span className="step-pill">Value</span>
          </div>
          <div style={{ marginBottom: 24 }}>
            <AIDraftButton field="objective" />
            <label>Objective</label>
            <textarea
              rows={4}
              placeholder={"What does this initiative set out to achieve?\nSpecific goals and success criteria"}
              value={formData.objective}
              onChange={(e) => update("objective", e.target.value)}
            />
          </div>
          <div>
            <AIDraftButton field="valueProposition" />
            <label>Value Proposition</label>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, marginTop: -4 }}>
              Include quantitative data, market stats, and projected CPM / revenue impact.
            </p>
            <textarea
              rows={7}
              placeholder={"Programmatic CPM uplift of 15–30% observed via behavioural targeting (IAB, 2024)\nReduction in wasted impressions by ~20% through 1st-party segmentation\nPotential to unlock £X additional revenue annually\nAligns with industry shift toward cookieless identity (Google Privacy Sandbox)"}
              value={formData.valueProposition}
              onChange={(e) => update("valueProposition", e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ── Step 4: Expected Outcomes ────────────────────────────────────── */}
      {step === 4 && (
        <div className="card" style={{ animation: "slideUp 0.3s ease" }}>
          <div className="section-tag">
            <span className="step-pill">Expected Outcomes</span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
            Projected benefits, success metrics, long-term impact, and growth opportunities.
          </p>
          <AIDraftButton field="expectedOutcomes" />
          <label>Expected Outcomes</label>
          <textarea
            rows={8}
            placeholder={"Projected benefits — quantify where possible\nSuccess metrics (KPIs, OKRs)\nLong-term strategic impact\nGrowth or expansion opportunities"}
            value={formData.expectedOutcomes}
            onChange={(e) => update("expectedOutcomes", e.target.value)}
          />
          <p style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>
            💡 One outcome per line — each becomes a bullet in the document.
          </p>

          <div className="card-inner" style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 12 }}>
              Ready to generate
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                ["Case Name", formData.caseName],
                ["Owner", formData.caseOwner],
                ["Objectives ticked", formData.objectives.filter((o) => o.checked).length.toString()],
                ["Format", "FPSM Template v1.0"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--text)", marginTop: 2 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
        <button
          className="btn-secondary"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          style={{ display: "flex", alignItems: "center", gap: 6, visibility: step === 0 ? "hidden" : "visible" }}
        >
          <ChevronLeft size={16} /> Back
        </button>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {generated && (
            <div className="success-toast">
              <CheckCircle2 size={18} /> Document downloaded!
            </div>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn-generate" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn-generate" onClick={handleGenerate} disabled={!canProceed() || generating}>
              {generating
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                : <><Download size={16} /> Download .docx</>}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
