import Fastify from 'fastify';
import cors from '@fastify/cors';
import OpenAI from 'openai';

const fastify = Fastify();
await fastify.register(cors);

// In-memory storage (serverless-safe)
const history = [];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Health check
fastify.get('/', async () => {
  return { status: 'Backend running on Vercel' };
});

fastify.post('/recommend', async (request, reply) => {
  try {
    const { userInput } = request.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: `Recommend 5 movies for: ${userInput}` }
      ]
    });

    const movies = completion.choices[0].message.content;

    history.push({
      userInput,
      movies,
      timestamp: new Date()
    });

    return { movies };

  } catch (err) {
    return {
      movies: "Unable to fetch AI response at the moment."
    };
  }
});

// Required for Vercel
export default async (req, res) => {
  await fastify.ready();
  fastify.server.emit('request', req, res);
};
