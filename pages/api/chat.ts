import type { NextApiRequest, NextApiResponse } from "next";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MODELS } from "@/lib/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { modelId, systemPrompt, userMessage } = req.body as {
    modelId: string;
    systemPrompt: string;
    userMessage: string;
  };

  const model = MODELS.find((m) => m.id === modelId);
  if (!model) return res.status(400).json({ error: "지원하지 않는 모델입니다." });

  const startTime = Date.now();

  try {
    if (model.provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "서버에 Anthropic API 키가 설정되지 않았습니다." });

      const client = new Anthropic({ apiKey });
      const response = await client.messages.create({
        model: modelId,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const text = response.content[0].type === "text" ? response.content[0].text : "";

      return res.status(200).json({ text, inputTokens, outputTokens, elapsedMs: Date.now() - startTime });
    }

    if (model.provider === "google") {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "서버에 Google API 키가 설정되지 않았습니다." });

      const genAI = new GoogleGenerativeAI(apiKey);
      const gemini = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: systemPrompt,
      });

      const result = await gemini.generateContent(userMessage);
      const response = result.response;
      const text = response.text();
      const inputTokens = response.usageMetadata?.promptTokenCount ?? 0;
      const outputTokens = response.usageMetadata?.candidatesTokenCount ?? 0;

      return res.status(200).json({ text, inputTokens, outputTokens, elapsedMs: Date.now() - startTime });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return res.status(500).json({ error: message });
  }
}
