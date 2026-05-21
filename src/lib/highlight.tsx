import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Volume2 } from "lucide-react";
import { speakJa } from "./tts";
import type { Vocab } from "@/data/exams";

type Segment = { text: string; vocab?: Vocab };

function buildSegments(jp: string, vocab: Vocab[]): Segment[] {
  // Greedy first-match per vocab, non-overlapping.
  const occupied: Array<{ start: number; end: number; vocab: Vocab }> = [];
  for (const v of vocab) {
    if (!v.jp) continue;
    let from = 0;
    while (from < jp.length) {
      const idx = jp.indexOf(v.jp, from);
      if (idx === -1) break;
      const end = idx + v.jp.length;
      const overlaps = occupied.some((o) => !(end <= o.start || idx >= o.end));
      if (!overlaps) {
        occupied.push({ start: idx, end, vocab: v });
        break;
      }
      from = idx + 1;
    }
  }
  occupied.sort((a, b) => a.start - b.start);

  const segs: Segment[] = [];
  let cursor = 0;
  for (const o of occupied) {
    if (o.start > cursor) segs.push({ text: jp.slice(cursor, o.start) });
    segs.push({ text: jp.slice(o.start, o.end), vocab: o.vocab });
    cursor = o.end;
  }
  if (cursor < jp.length) segs.push({ text: jp.slice(cursor) });
  return segs;
}

export function HighlightedJa({ jp, vocab }: { jp: string; vocab: Vocab[] }) {
  const segments = buildSegments(jp, vocab);
  return (
    <TooltipProvider delayDuration={150}>
      <span className="font-jp leading-relaxed">
        {segments.map((s, i) =>
          s.vocab ? (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <mark className="bg-yellow-200 text-foreground rounded px-0.5 cursor-help">
                  {s.text}
                </mark>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-semibold">
                      {s.vocab.jp}
                      {s.vocab.reading && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({s.vocab.reading})
                        </span>
                      )}
                    </div>
                    <div className="text-sm">{s.vocab.vi}</div>
                  </div>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakJa(s.vocab!.jp);
                    }}
                    aria-label="Phát âm từ vựng"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </span>
    </TooltipProvider>
  );
}
