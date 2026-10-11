import { useState } from "react";

type Json = unknown;
type JsonObject = Record<string, Json>;

function isObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrimitive(value: Json): boolean {
  return value === null || typeof value !== "object";
}

// 모델이 ```json ... ``` 코드펜스로 감싸서 응답하거나, 그 뒤에 코드펜스 밖 설명을
// 덧붙이는 경우가 있어(스키마 미준수) 앞뒤에 뭐가 더 붙어 있어도 첫 번째 코드펜스 블록만 뽑아낸다.
export function stripCodeFence(text: string): string {
  const match = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1] : text.trim();
}

function Primitive({ value }: { value: Json }) {
  if (value === null || value === undefined) return <span className="text-[#5c5c5c]">—</span>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

// 값의 타입에 따라 표/리스트/텍스트로 재귀 렌더링한다. 필드 이름을 가정하지 않는다.
function Value({ value }: { value: Json }) {
  if (isPrimitive(value)) return <Primitive value={value} />;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[#5c5c5c]">—</span>;
    if (value.every(isPrimitive)) {
      return (
        <ul className="list-disc list-inside">
          {value.map((v, i) => (
            <li key={i}><Primitive value={v} /></li>
          ))}
        </ul>
      );
    }
    if (value.every(isObject)) return <ObjectArrayTable rows={value as JsonObject[]} />;
    return (
      <div className="flex flex-col gap-1">
        {value.map((v, i) => (
          <Value key={i} value={v} />
        ))}
      </div>
    );
  }

  return <KeyValueTable data={value as JsonObject} />;
}

function KeyValueTable({ data }: { data: JsonObject }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <span className="text-[#5c5c5c]">—</span>;
  return (
    <table className="w-full text-sm border-collapse">
      <tbody>
        {entries.map(([key, value]) => (
          <tr key={key} className="border border-[#3c3c3c] align-top">
            <th className="text-left font-mono text-xs text-[#8ab4f8] bg-[#1a1a1a] px-2 py-1.5 w-40 whitespace-nowrap">{key}</th>
            <td className="text-[#e8eaed] px-2 py-1.5"><Value value={value} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ObjectArrayTable({ rows }: { rows: JsonObject[] }) {
  // 행마다 키가 달라도 모든 키를 컬럼으로 노출한다.
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left font-mono text-xs text-[#8ab4f8] bg-[#1a1a1a] border border-[#3c3c3c] px-2 py-1.5">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {columns.map((c) => (
                <td key={c} className="text-[#e8eaed] border border-[#3c3c3c] px-2 py-1.5">
                  <Value value={row[c] as Json} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalysisResult({ text }: { text: string }) {
  const [showRaw, setShowRaw] = useState(false);

  let parsed: Json = null;
  try {
    parsed = JSON.parse(stripCodeFence(text));
  } catch {
    parsed = null;
  }

  // 위기 감지 응답이나 JSON이 아닌 출력은 원문 그대로 보여준다.
  if (!isObject(parsed)) {
    return <div className="text-sm text-[#e8eaed] whitespace-pre-wrap leading-relaxed">{text}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {Object.entries(parsed).map(([key, value]) => (
        <section key={key} className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#9aa0a6]">{key}</span>
          <div className="text-sm text-[#e8eaed]">
            <Value value={value} />
          </div>
        </section>
      ))}

      <div className="border-t border-[#3c3c3c] pt-2">
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="text-xs text-[#9aa0a6] hover:text-[#e8eaed] transition-colors"
        >
          {showRaw ? "Raw JSON 숨기기" : "Raw JSON 보기"}
        </button>
        {showRaw && (
          <pre className="mt-2 text-xs text-[#bdc1c6] bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
