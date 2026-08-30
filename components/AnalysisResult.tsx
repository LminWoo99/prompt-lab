import { Fragment } from "react";

interface SignalItem {
  label: string;
  observation: string;
  interpretation: string | null;
}

interface AnalysisBasic {
  headline: string;
  key_signal: SignalItem;
  supporting_signals: SignalItem[];
  relation_readout: Record<string, unknown> | null;
  overall_assessment: string;
  teaser_hidden_intent?: string;
  teaser_next_move?: string;
}

interface FrameworkDetail {
  primary: string;
  primary_result: string;
  secondary?: string;
  secondary_result?: string;
}

interface LightNextMove {
  direction: string;
  direction_reason: string;
  avoid_message: string;
  send_timing: string;
}

interface AnalysisDeep {
  framework_detail?: FrameworkDetail;
  light_next_move?: LightNextMove;
  my_contribution?: string | null;
  risk_signals?: Array<Record<string, unknown>>;
}

interface RecommendedReply {
  style: string;
  message: string;
}

interface AnalysisNextMove {
  situation_read?: string;
  recommended_replies?: RecommendedReply[];
  event_strategy?: string;
  expected_response?: string;
  messages_to_avoid?: string[];
}

interface AnalysisOutput {
  tier: string;
  relation_type: string;
  basic: AnalysisBasic;
  deep: AnalysisDeep | null;
  next_move: AnalysisNextMove | null;
  disclaimer: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return Array.isArray(value) ? value.join(", ") : String(value);
}

function KeyValueGrid({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      {Object.entries(data).map(([key, value]) => (
        <Fragment key={key}>
          <span className="text-[#7a8a9a]">{key}</span>
          <span className="text-[#e8eaed]">{formatValue(value)}</span>
        </Fragment>
      ))}
    </div>
  );
}

function SignalCard({ signal }: { signal: SignalItem }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3 flex flex-col gap-1">
      <span className="text-xs font-mono text-[#8ab4f8]">{signal.label}</span>
      <p className="text-sm text-[#bdc1c6]">{signal.observation}</p>
      {signal.interpretation && <p className="text-sm text-[#e8eaed]">→ {signal.interpretation}</p>}
    </div>
  );
}

export default function AnalysisResult({ text }: { text: string }) {
  let parsed: AnalysisOutput | null = null;
  try {
    const candidate = JSON.parse(text);
    if (candidate && typeof candidate === "object" && "basic" in candidate) parsed = candidate;
  } catch {
    parsed = null;
  }

  // 위기 감지 응답이나 JSON이 아닌 출력은 원문 그대로 보여준다.
  if (!parsed) {
    return <div className="text-sm text-[#e8eaed] whitespace-pre-wrap leading-relaxed">{text}</div>;
  }

  const { basic, deep, next_move, relation_type, tier, disclaimer } = parsed;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-[#2d2d2d] text-[#9aa0a6] px-2 py-0.5 rounded-full">{relation_type}</span>
        <span className="text-xs bg-[#2d2d2d] text-[#9aa0a6] px-2 py-0.5 rounded-full">{tier}</span>
      </div>

      <h3 className="text-base font-semibold text-[#e8eaed]">{basic.headline}</h3>

      <SignalCard signal={basic.key_signal} />

      {basic.supporting_signals?.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-[#9aa0a6]">보조 시그널</span>
          {basic.supporting_signals.map((s, i) => (
            <SignalCard key={i} signal={s} />
          ))}
        </div>
      )}

      {basic.relation_readout && (
        <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3">
          <span className="text-xs text-[#9aa0a6] block mb-1.5">relation_readout</span>
          <KeyValueGrid data={basic.relation_readout} />
        </div>
      )}

      <p className="text-sm text-[#bdc1c6] leading-relaxed">{basic.overall_assessment}</p>

      {(basic.teaser_hidden_intent || basic.teaser_next_move) && (
        <div className="bg-[#2a1e3a] border border-[#4a2d6a] rounded-lg p-3 flex flex-col gap-1.5">
          {basic.teaser_hidden_intent && <p className="text-sm text-[#c9a8f0]">🔒 {basic.teaser_hidden_intent}</p>}
          {basic.teaser_next_move && <p className="text-sm text-[#c9a8f0]">🔒 {basic.teaser_next_move}</p>}
        </div>
      )}

      {deep && (
        <div className="flex flex-col gap-2 border-t border-[#3c3c3c] pt-3">
          <span className="text-xs text-[#9aa0a6]">deep</span>
          {deep.framework_detail && (
            <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3 text-sm text-[#bdc1c6]">
              <p><span className="text-[#8ab4f8]">{deep.framework_detail.primary}</span>: {deep.framework_detail.primary_result}</p>
              {deep.framework_detail.secondary && (
                <p className="mt-1"><span className="text-[#8ab4f8]">{deep.framework_detail.secondary}</span>: {deep.framework_detail.secondary_result}</p>
              )}
            </div>
          )}
          {deep.light_next_move && (
            <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3 text-sm text-[#bdc1c6] flex flex-col gap-1">
              <span className="text-[#e8eaed] font-medium">{deep.light_next_move.direction} · {deep.light_next_move.send_timing}</span>
              <p>{deep.light_next_move.direction_reason}</p>
              <p className="text-[#f28b82]">피해야 할 말: {deep.light_next_move.avoid_message}</p>
            </div>
          )}
          {deep.my_contribution && <p className="text-sm text-[#bdc1c6]">{deep.my_contribution}</p>}
          {deep.risk_signals && deep.risk_signals.length > 0 && (
            <div className="bg-[#3a1a1a] border border-[#6a2a2a] rounded-lg p-3 text-sm text-[#f28b82] flex flex-col gap-1">
              {deep.risk_signals.map((r, i) => (
                <span key={i}>{formatValue(r.type)} — {formatValue(r.basis)}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {next_move && (
        <div className="flex flex-col gap-2 border-t border-[#3c3c3c] pt-3">
          <span className="text-xs text-[#9aa0a6]">next_move</span>
          {next_move.situation_read && <p className="text-sm text-[#bdc1c6]">{next_move.situation_read}</p>}
          {next_move.recommended_replies?.map((r, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3 text-sm">
              <span className="text-[#8ab4f8] text-xs block mb-1">{r.style}</span>
              <p className="text-[#e8eaed]">{r.message}</p>
            </div>
          ))}
          {next_move.event_strategy && <p className="text-sm text-[#bdc1c6]">{next_move.event_strategy}</p>}
          {next_move.expected_response && <p className="text-sm text-[#bdc1c6]">예상 반응: {next_move.expected_response}</p>}
          {next_move.messages_to_avoid && next_move.messages_to_avoid.length > 0 && (
            <div className="text-sm text-[#f28b82] flex flex-col gap-1">
              {next_move.messages_to_avoid.map((m, i) => (
                <p key={i}>피해야 할 말: {m}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[#5c5c5c] italic">{disclaimer}</p>
    </div>
  );
}
