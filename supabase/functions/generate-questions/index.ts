// Supabase Edge Function: generate-questions
// Generates GCSE practice questions with Claude, tailored to the sub-topic,
// the student's target grade and current progress. The Anthropic API key is
// read from the ANTHROPIC_API_KEY secret and never leaves the server.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("ANTHROPIC_MODEL") || "claude-opus-5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}

function difficultyFor(target: string, status: string): string {
  const t = parseInt(String(target).replace(/[^0-9]/g, ""), 10);
  const s = String(status).toLowerCase();
  let band: string;
  if (t >= 7) band = "higher tier, stretching (grades 7-9), with application and multi-step reasoning";
  else if (t >= 4) band = "standard (grades 4-6), a mix of recall and application";
  else if (t >= 1) band = "foundation (grades 1-3), mostly recall and straightforward application";
  else band = "a broad GCSE range from recall to some application";
  let adj = "";
  if (s.indexOf("not started") >= 0 || s.indexOf("weak") >= 0) adj = " Start at the more accessible end to build confidence.";
  else if (s.indexOf("mastered") >= 0) adj = " Lean towards the harder end to stretch him.";
  return band + adj;
}

// deno-lint-ignore no-explicit-any
function parseQuestions(text: string): any[] {
  const out: any[] = [];
  let s = String(text || "").trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  let arr: any = null;
  try { arr = JSON.parse(s); } catch (_) {
    const m = s.match(/\[[\s\S]*\]/);
    if (m) { try { arr = JSON.parse(m[0]); } catch (__) { /* ignore */ } }
  }
  if (!Array.isArray(arr)) return out;
  for (const q of arr) {
    if (!q || typeof q !== "object") continue;
    const qt = String(q.q || "").trim();
    if (!qt) continue;
    if (q.type === "mc") {
      const opts = (Array.isArray(q.options) ? q.options : []).map((o: unknown) => String(o).trim()).filter(Boolean).slice(0, 4);
      if (opts.length < 2) continue;
      let ans = parseInt(q.answer, 10);
      if (isNaN(ans) || ans < 0 || ans >= opts.length) ans = 0;
      out.push({ type: "mc", q: qt, options: opts, answer: ans });
    } else {
      const a = String(q.answer || "").trim();
      if (!a) continue;
      out.push({ type: "short", q: qt, answer: a });
    }
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  if (!ANTHROPIC_API_KEY) {
    return json({ error: "AI is not configured yet. An ANTHROPIC_API_KEY secret needs adding to this Supabase project." }, 503);
  }
  try {
    const body = await req.json().catch(() => ({}));
    const subject = String(body.subject || "").slice(0, 120);
    const board = String(body.board || "").slice(0, 60);
    const topic = String(body.topic || "").slice(0, 120);
    const subtopic = String(body.subtopic || "").slice(0, 160);
    const target = String(body.targetGrade || "").slice(0, 12);
    const status = String(body.status || "").slice(0, 60);
    let count = parseInt(body.count, 10);
    if (!count || count < 1) count = 5;
    if (count > 10) count = 10;
    const existing = Array.isArray(body.existing)
      ? body.existing.slice(0, 40).map((s: unknown) => String(s).slice(0, 200))
      : [];

    if (!subtopic && !topic && !subject) return json({ error: "Nothing to generate from." }, 400);

    const difficulty = difficultyFor(target, status);
    const system = `You are an experienced UK GCSE examiner and tutor. You write accurate, exam-appropriate practice questions${board ? ` aligned to the ${board} GCSE specification` : ""}. Every question must be factually correct and unambiguous, with a single clearly-correct answer, and pitched at the requested difficulty. Reply with ONLY valid JSON — no commentary, no markdown fences.`;

    const user = `Write ${count} GCSE practice questions for:
Subject: ${subject}
Topic: ${topic}
Sub-topic: ${subtopic}
Target grade: ${target || "unspecified"} (GCSE grades run 9 highest to 1 lowest)
Current level: ${status || "unspecified"}
Pitch the difficulty at: ${difficulty}

Use a mix of multiple-choice and short-answer questions — multiple-choice for recall/understanding, short-answer for precise terms, values or definitions.
${existing.length ? `Do NOT repeat or closely paraphrase these existing questions:\n- ${existing.join("\n- ")}\n` : ""}
Return a JSON array. Each element is exactly one of:
{"type":"mc","q":"<question>","options":["<A>","<B>","<C>","<D>"],"answer":<index 0-3 of the correct option>}
{"type":"short","q":"<question>","answer":"<exact expected answer, a few words>"}
Rules: multiple-choice must have exactly 4 plausible options; keep short-answer answers concise; no numbering or markdown in the text.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system,
        messages: [{ role: "user", content: user }],
        output_config: { effort: "low" },
      }),
    });

    if (!resp.ok) {
      const detail = (await resp.text().catch(() => "")).slice(0, 300);
      return json({ error: "The AI request failed.", detail }, 502);
    }
    const data = await resp.json();
    const text = (data.content || [])
      .filter((b: { type?: string }) => b && b.type === "text")
      .map((b: { text?: string }) => b.text || "")
      .join("\n");
    const questions = parseQuestions(text);
    if (!questions.length) return json({ error: "The AI didn't return usable questions — please try again." }, 502);
    return json({ questions });
  } catch (e) {
    return json({ error: String((e && (e as Error).message) || e) }, 500);
  }
});
