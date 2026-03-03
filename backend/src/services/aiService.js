const OpenAI = require("openai");
const KnowledgeArticle = require("../models/KnowledgeArticle");
const MaintenanceEvent = require("../models/MaintenanceEvent");
const ModEvent = require("../models/ModEvent");
const Car = require("../models/Car");

let openai = null;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY not set. AI advice will return mock responses.");
    return null;
  }
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

async function retrieveKnowledge(carId, question) {
  const car = await Car.findById(carId);
  if (!car) throw new Error("Car not found");

  // Search knowledge base by make/model and question keywords
  const keywords = question.toLowerCase().split(" ");

  const articles = await KnowledgeArticle.find({
    $or: [
      { compatibility: { makeModels: car.make } },
      { compatibility: { makeModels: "all" } },
      { tags: { $in: keywords } },
    ],
  })
    .sort({ priority: -1 })
    .limit(10);

  return articles;
}

async function getCarHistory(carId) {
  const maintenance = await MaintenanceEvent.find({ carId }).sort({ date: -1 }).limit(20);
  const mods = await ModEvent.find({ carId }).sort({ date: -1 }).limit(20);

  return { maintenance, mods };
}

async function generateAiAdvice(carId, question, budget = null, goals = []) {
  const car = await Car.findById(carId);
  if (!car) throw new Error("Car not found");

  // Retrieve relevant knowledge
  const knowledge = await retrieveKnowledge(carId, question);
  const history = await getCarHistory(carId);

  const openaiClient = getOpenAIClient();

  // If no OpenAI key, return mock structured response
  if (!openaiClient) {
    return generateMockAdvice(car, question, knowledge);
  }

  // Build context for GPT
  const knowledgeContext = knowledge
    .map((a) => `${a.title}: ${a.content} (Priority: ${a.priority}, Cost: ${a.cost})`)
    .join("\n\n");

  const historyContext = `
    Previous Maintenance: ${history.maintenance
      .map((m) => `${m.type} at ${m.mileage}mi on ${m.date}`)
      .join("; ")}
    Previous Mods: ${history.mods
      .map((m) => `${m.brand} ${m.part} (${m.category})`)
      .join("; ")}
  `;

  const systemPrompt = `You are an expert automotive advisor helping owners of ${car.year} ${car.make} ${car.model} vehicles.
  Provide structured advice based on the car's history and the knowledge base.
  Return your response as JSON with these exact fields:
  {
    "summary": "brief overview of recommendations",
    "maintenance": [{"title": "...", "priority": 1-5, "why": "...", "when": "...", "est_cost": "£/££/£££"}],
    "mods": [{"title": "...", "priority": 1-5, "why": "...", "requires": [], "risks": "...", "est_cost": "£/££/£££"}],
    "checks": ["question to ask owner", ...],
    "disclaimer": "standard disclaimer text"
  }`;

  const userPrompt = `Car: ${car.year} ${car.make} ${car.model}
  Mileage: ${car.mileage || "Unknown"}
  Goals: ${goals.join(", ") || "General"}
  Budget: ${budget ? `£${budget}` : "Flexible"}
  User Question: ${question}
  
  Known History:
  ${historyContext}
  
  Knowledge Base:
  ${knowledgeContext}
  
  Provide concise, actionable advice in JSON format.`;

  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;

    // Parse JSON from response (GPT sometimes wraps it)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const advice = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return advice;
  } catch (err) {
    console.error("OpenAI Error:", err);
    // Return fallback structured response
    return generateMockAdvice(car, question, knowledge);
  }
}

function generateMockAdvice(car, question, knowledge) {
  return {
    summary: `Based on your ${car.year} ${car.make} ${car.model}, here are some recommendations for your question about "${question}". AI responses are currently in demo mode.`,
    maintenance: [
      {
        title: "Oil Change",
        priority: 1,
        why: "Regular oil changes keep your engine healthy",
        when: "Every 5,000-7,000 miles",
        est_cost: "£",
      },
      {
        title: "Filter Replacement",
        priority: 2,
        why: "Air and cabin filters improve performance",
        when: "Every 12,000-15,000 miles",
        est_cost: "£",
      },
    ],
    mods: [
      {
        title: "Better Tires",
        priority: 1,
        why: "Quality tires improve safety and handling",
        requires: [],
        risks: "Ensure proper wheel alignment after installation",
        est_cost: "££",
      },
    ],
    checks: [
      "What's your current mileage?",
      "Are there any warning lights?",
      "What type of driving do you mostly do?",
    ],
    disclaimer:
      "This is a demo response. For personalized advice, please add your OPENAI_API_KEY to .env",
  };
}

module.exports = {
  generateAiAdvice,
  retrieveKnowledge,
  getCarHistory,
};
