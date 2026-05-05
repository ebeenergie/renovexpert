import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!messages || !Array.isArray(messages)) {
    return Response.json({ error: "Messages requis" }, { status: 400 });
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "Tu es un assistant expert en rénovation énergétique pour les artisans du bâtiment en France. " +
      "Tu connais parfaitement les aides MaPrimeRénov' (MPR), les Certificats d'Économies d'Énergie (CEE), " +
      "les aides ANAH (Agence Nationale de l'Habitat), ainsi que toutes les réglementations en vigueur. " +
      "Tu aides les artisans à constituer leurs dossiers, optimiser les aides pour leurs clients, " +
      "et répondre à toutes leurs questions techniques et administratives. " +
      "Réponds toujours en français, de manière claire et professionnelle.",
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
