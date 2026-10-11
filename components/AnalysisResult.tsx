import { ReactNode, useState } from "react";

type Json = unknown;
type JsonObject = Record<string, Json>;

// 이 길이 이하의 값은 칩/표 셀로, 그보다 긴 값은 문장(본문)으로 취급한다.
const SHORT_MAX = 12;
// 이 길이 이하의 값은 라벨과 같은 줄에 둔다.
const INLINE_MAX = 48;
const TABLE_MAX_COLUMNS = 5;

function isObject(value: Json): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPrimitive(value: Json): boolean {
  return value === null || typeof value !== "object";
}

function isEmpty(value: Json): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isObject(value)) return Object.keys(value).length === 0;
  return false;
}

// 한 줄로 표시할 수 있는 값: 원시값이거나 비어 있는 값.
function isLeaf(value: Json): boolean {
  return isPrimitive(value) || isEmpty(value);
}

function isShort(value: Json, max: number): boolean {
  if (isEmpty(value)) return true;
  if (!isPrimitive(value)) return false;
  const s = String(value);
  return s.length <= max && !s.includes("\n");
}

// 모델이 ```json ... ``` 코드펜스로 감싸서 응답하거나, 그 뒤에 코드펜스 밖 설명을
// 덧붙이는 경우가 있어(스키마 미준수) 앞뒤에 뭐가 더 붙어 있어도 첫 번째 코드펜스 블록만 뽑아낸다.
export function stripCodeFence(text: string): string {
  const match = text.trim().match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1] : text.trim();
}

const LABEL_CLASS = "font-mono text-xs text-[#9aa0a6] break-all";

function Leaf({ value }: { value: Json }) {
  if (isEmpty(value)) return <span className="text-[#5c5c5c]">—</span>;
  return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
}

function Stack({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className={LABEL_CLASS}>{label}</span>
      <div className="text-[#bdc1c6] max-w-[68ch] min-w-0">{children}</div>
    </div>
  );
}

function Section({ label, value }: { label: string; value: Json }) {
  const count = Array.isArray(value) ? value.length : Object.keys(value as JsonObject).length;
  return (
    <details open className="group min-w-0">
      <summary className="flex items-center gap-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden font-mono text-xs font-semibold text-[#8ab4f8]">
        <span className="text-[#9aa0a6] transition-transform group-open:rotate-90">▸</span>
        {label}
        <span className="font-sans font-medium text-[11px] text-[#9aa0a6] bg-[#1a1a1a] border border-[#3c3c3c] rounded-full px-1.5">{count}</span>
      </summary>
      <div className="pt-2 pl-3.5 min-w-0">
        <Value value={value} />
      </div>
    </details>
  );
}

// 필드 이름은 가정하지 않고, 값의 타입과 길이만 보고 배치한다.
function FieldList({ data }: { data: JsonObject }) {
  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      {Object.entries(data).map(([key, value]) => {
        if (!isLeaf(value)) return <Section key={key} label={key} value={value} />;
        if (isShort(value, INLINE_MAX)) {
          return (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-x-3.5 gap-y-0.5 items-baseline">
              <span className={LABEL_CLASS}>{key}</span>
              <span className="min-w-0 break-words"><Leaf value={value} /></span>
            </div>
          );
        }
        return (
          <Stack key={key} label={key}>
            <Leaf value={value} />
          </Stack>
        );
      })}
    </div>
  );
}

function PrimitiveList({ items }: { items: Json[] }) {
  return (
    <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
      {items.map((item, i) => (
        <li key={i} className="border-l-2 border-[#8ab4f8] pl-2.5 text-[#e8eaed]">
          <Leaf value={item} />
        </li>
      ))}
    </ul>
  );
}

// 항목 하나를 카드로 그린다. 첫 필드가 짧은 식별자면 제목으로, 나머지 짧은 값은 칩으로, 긴 값은 본문으로 둔다.
function Card({ row }: { row: JsonObject }) {
  const entries = Object.entries(row);
  const [firstKey, firstValue] = entries[0] ?? [];
  const hasTitle = firstKey !== undefined && isPrimitive(firstValue) && !isEmpty(firstValue) && isShort(firstValue, INLINE_MAX);
  const rest = hasTitle ? entries.slice(1) : entries;
  const chips = rest.filter(([, v]) => isLeaf(v) && isShort(v, SHORT_MAX));
  const body = rest.filter(([, v]) => !(isLeaf(v) && isShort(v, SHORT_MAX)));

  return (
    <div className="bg-[#1a1a1a] border border-[#3c3c3c] rounded-lg p-3 flex flex-col gap-2.5 min-w-0">
      {(hasTitle || chips.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          {hasTitle && <span className="font-mono text-[13px] font-semibold text-[#e8eaed] break-all">{String(firstValue)}</span>}
          {chips.map(([k, v]) => (
            <span key={k} className="text-[11px] text-[#bdc1c6] bg-[#1e1e1e] border border-[#3c3c3c] rounded-full px-2 whitespace-nowrap">
              <span className="text-[#9aa0a6] mr-1">{k}</span>
              <Leaf value={v} />
            </span>
          ))}
        </div>
      )}
      {body.map(([k, v]) => (
        <Stack key={k} label={k}>
          <Value value={v} />
        </Stack>
      ))}
    </div>
  );
}

// 모든 값이 짧은 객체 배열만 표로 그린다. 그렇지 않으면 칸이 좁아져 글자가 잘린다.
function canRenderAsTable(rows: JsonObject[], columns: string[]): boolean {
  return columns.length <= TABLE_MAX_COLUMNS && rows.every((r) => Object.values(r).every((v) => isShort(v, SHORT_MAX)));
}

function ObjectArrayTable({ rows, columns }: { rows: JsonObject[]; columns: string[] }) {
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
                  <Leaf value={row[c]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Value({ value }: { value: Json }) {
  if (isLeaf(value)) return <Leaf value={value} />;

  if (Array.isArray(value)) {
    if (value.every(isPrimitive)) return <PrimitiveList items={value} />;
    if (value.every(isObject)) {
      const rows = value as JsonObject[];
      // 행마다 키가 달라도 모든 키를 컬럼으로 노출한다.
      const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      if (canRenderAsTable(rows, columns)) return <ObjectArrayTable rows={rows} columns={columns} />;
      return (
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <Card key={i} row={row} />
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        {value.map((v, i) => (
          <Value key={i} value={v} />
        ))}
      </div>
    );
  }

  return <FieldList data={value as JsonObject} />;
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
    <div className="flex flex-col gap-3 text-sm text-[#e8eaed]">
      <FieldList data={parsed} />

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
