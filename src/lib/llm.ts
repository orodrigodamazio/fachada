const BASE_URL = process.env.LLM_BASE_URL ?? "https://api.openai.com/v1";
const API_KEY = process.env.LLM_API_KEY ?? "";
const MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

export type LLMOptions = { temperature?: number; maxTokens?: number };

export class LLMError extends Error {
  constructor(message: string, public code: "NO_KEY" | "RATE_LIMIT" | "API_ERROR" | "TIMEOUT") {
    super(message);
    this.name = "LLMError";
  }
}

export async function generateText(prompt: string, system?: string, opts: LLMOptions = {}): Promise<string> {
  if (!API_KEY) throw new LLMError("LLM_API_KEY não configurada", "NO_KEY");

  const messages = [
    ...(system ? [{ role: "system", content: system }] : []),
    { role: "user", content: prompt },
  ];

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens ?? 600,
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new LLMError("Timeout ou falha de rede", "TIMEOUT");
  }

  if (res.status === 429) throw new LLMError("Rate limit do provedor", "RATE_LIMIT");
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new LLMError(`API ${res.status}: ${txt.slice(0, 200)}`, "API_ERROR");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new LLMError("Resposta vazia", "API_ERROR");
  return content;
}
