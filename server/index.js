import Fastify from "fastify";
import cors from "@fastify/cors";
import OpenAI from "openai";
import { pathToFileURL } from "node:url";

const fastify = Fastify({ logger: true });

await fastify.register(cors, {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://movie-recommendation-frontend-two.vercel.app",
  ],
});

const history = [];

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

fastify.get("/", async () => {
  return {
    status: "ok",
    service: "movie-recommendation-backend",
    time: new Date().toISOString(),
  };
});

fastify.post("/recommend", async (request, reply) => {
  try {
    const userInput = request.body?.userInput?.trim();
    if (!userInput) {
      return reply.code(400).send({ error: "userInput is required" });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return reply.code(500).send({
        error:
          "OPENAI_API_KEY is not configured on backend. Add it in Vercel project settings.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content:
            "You are an expert movie recommendation assistant. Return exactly 5 high-quality recommendations tailored to the user's request. Include title, year, language/industry (if relevant), genre, and a short reason. If user asks for Indian, Kannada, Telugu, Tamil, Hindi, or regional cinema, prioritize those accurately and avoid unrelated Hollywood picks unless explicitly requested.",
        },
        {
          role: "user",
          content: `User preference: ${userInput}`,
        },
      ],
    });

    const movies = completion.choices?.[0]?.message?.content?.trim();
    if (!movies) {
      return reply.code(502).send({
        error: "AI did not return recommendations. Please retry.",
      });
    }

    history.push({
      userInput,
      movies,
      timestamp: new Date().toISOString(),
    });
    if (history.length > 25) history.shift();

    return { movies };
  } catch (err) {
    request.log.error(err);
    if (err?.status === 429) {
      return reply.code(429).send({
        error:
          "OpenAI quota exceeded for current API key. Add billing or use another key in backend Vercel settings.",
      });
    }
    return reply.code(500).send({
      error: err?.message || "Unable to fetch AI response at the moment.",
    });
  }
});

fastify.get("/history", async () => {
  return { history: [...history].reverse() };
});

export default async function handler(req, res) {
  await fastify.ready();
  fastify.server.emit("request", req, res);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const port = Number(process.env.PORT || 3000);
  fastify
    .listen({ port, host: "0.0.0.0" })
    .then(() => fastify.log.info(`Server running on port ${port}`))
    .catch((err) => {
      fastify.log.error(err);
      process.exit(1);
    });
}
