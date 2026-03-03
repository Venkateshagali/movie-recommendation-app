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

const fallbackCatalog = [
  { title: "Inception", year: 2010, genre: "Sci-Fi/Thriller", tags: ["sci-fi", "thriller", "mind-bending", "twist"] },
  { title: "Interstellar", year: 2014, genre: "Sci-Fi/Drama", tags: ["sci-fi", "space", "emotional", "drama"] },
  { title: "The Dark Knight", year: 2008, genre: "Action/Crime", tags: ["action", "crime", "superhero", "dark"] },
  { title: "Parasite", year: 2019, genre: "Thriller/Drama", tags: ["thriller", "drama", "social", "korean"] },
  { title: "The Shawshank Redemption", year: 1994, genre: "Drama", tags: ["drama", "inspiring", "classic"] },
  { title: "Whiplash", year: 2014, genre: "Drama/Music", tags: ["drama", "intense", "motivational"] },
  { title: "The Grand Budapest Hotel", year: 2014, genre: "Comedy/Adventure", tags: ["comedy", "quirky", "visual"] },
  { title: "Mad Max: Fury Road", year: 2015, genre: "Action/Adventure", tags: ["action", "adventure", "fast", "post-apocalyptic"] },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, genre: "Animation/Action", tags: ["animation", "action", "fun", "superhero"] },
  { title: "Coco", year: 2017, genre: "Animation/Family", tags: ["animation", "family", "emotional"] },
  { title: "The Conjuring", year: 2013, genre: "Horror", tags: ["horror", "supernatural", "scary"] },
  { title: "Get Out", year: 2017, genre: "Horror/Thriller", tags: ["horror", "thriller", "psychological"] },
  { title: "La La Land", year: 2016, genre: "Romance/Musical", tags: ["romance", "musical", "feel-good"] },
  { title: "Before Sunrise", year: 1995, genre: "Romance/Drama", tags: ["romance", "conversation", "indie"] },
  { title: "The Social Network", year: 2010, genre: "Drama/Biography", tags: ["drama", "startup", "tech"] },
  { title: "The Martian", year: 2015, genre: "Sci-Fi/Adventure", tags: ["sci-fi", "space", "survival"] },
];

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function buildFallbackRecommendations(userInput) {
  const keywords = userInput.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);

  const ranked = fallbackCatalog
    .map((movie) => {
      const score = keywords.reduce(
        (acc, keyword) => (movie.tags.some((tag) => tag.includes(keyword)) ? acc + 1 : acc),
        0
      );
      return { ...movie, score };
    })
    .sort((a, b) => b.score - a.score);

  const picks = ranked.slice(0, 5);
  return picks
    .map(
      (movie, index) =>
        `${index + 1}. ${movie.title} (${movie.year}) - ${movie.genre}\nReason: Good match for ${userInput}.`
    )
    .join("\n\n");
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
    let movies = "";
    if (openai) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You are a movie recommendation assistant. Recommend exactly 5 movies. For each movie include: title, year, genre, and one short reason. Keep the response concise and easy to read.",
          },
          {
            role: "user",
            content: `Recommend movies for this preference: ${userInput}`,
          },
        ],
      });
      movies = completion.choices?.[0]?.message?.content?.trim() || "";
    }

    if (!movies) {
      movies = buildFallbackRecommendations(userInput);
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
    return reply.code(500).send({
      error: "Unable to fetch AI response at the moment.",
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
