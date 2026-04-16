const KnowledgeArticle = require("../models/KnowledgeArticle");
const MaintenanceEvent = require("../models/MaintenanceEvent");
const ModEvent = require("../models/ModEvent");
const Car = require("../models/Car");
const cloudinary = require("cloudinary").v2;
const { InferenceClient } = require("@huggingface/inference");

let groqClient = null;
let hfClient = null;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY not set. AI advice will return mock responses.");
    return null;
  }

  if (!groqClient) {
    // Since we don't have @groq/sdk installed, we'll use fetch with the REST API
    groqClient = {
      apiKey: process.env.GROQ_API_KEY,
    };
  }

  return groqClient;
}

async function callGroqAPI(systemPrompt, userPrompt) {
  const groq = getGroqClient();
  if (!groq) return null;

  try {
    const candidateModels = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"];

    for (const model of candidateModels) {
      console.log("[Groq] Calling API with model:", model);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groq.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      const rawBody = await response.text();
      console.log("[Groq] Response status for", model + ":", response.status);

      if (!response.ok) {
        console.error("[Groq] API error for", model + ":", rawBody);
        continue;
      }

      const data = JSON.parse(rawBody);
      const content = data.choices?.[0]?.message?.content || null;
      if (content) {
        console.log("[Groq] API success with", model);
        return content;
      }
    }

    return null;
  } catch (err) {
    console.error("[Groq] Request error:", err.message);
    return null;
  }
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

  const groq = getGroqClient();

  // Build context for Groq
  const knowledgeContext = knowledge
    .map((a) => `${a.title}: ${a.content} (Priority: ${a.priority}, Cost: ${a.cost})`)
    .join("\n\n");

  const historyContext = `
    Previous Maintenance: ${history.maintenance
      .map(
        (m) =>
          `${m.type} at ${m.mileage || "unknown"}mi on ${new Date(m.date).toISOString().split("T")[0]}${
            m.notes ? ` (notes: ${m.notes})` : ""
          }`
      )
      .join("; ")}
    Previous Mods: ${history.mods
      .map(
        (m) =>
          `${[m.brand, m.part].filter(Boolean).join(" ")} (${m.category}) installed on ${new Date(m.date)
            .toISOString()
            .split("T")[0]}${m.notes ? ` (notes: ${m.notes})` : ""}`
      )
      .join("; ")}
  `;

  const photoContext = `
    Car Photos Count: ${car.photoUrls?.length || 0}
    Car Photo URLs: ${(car.photoUrls || []).slice(0, 6).join("; ") || "none"}
  `;

  const systemPrompt = `You are an expert automotive advisor helping owners of ${car.year} ${car.make} ${car.model} vehicles.
  Provide structured advice based on the car's history and the knowledge base.
  If car photos are provided, use them as visual context for style/state observations in text.
  Do not claim to generate or return edited/generated images.
  Treat all listed maintenance and mods in history as already completed work.
  Do not recommend duplicates of already completed items unless there is a clear service interval due, a worn/failed condition, or a specific upgrade path.
  If something was already done recently, prefer follow-up checks/interval guidance over repeating the same recommendation.
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

  Photo Context:
  ${photoContext}
  
  Knowledge Base:
  ${knowledgeContext}
  
  Provide concise, actionable advice in JSON format.`;

  try {
    if (!groq) {
      // No Groq API key, return mock advice
      return generateMockAdvice(car, question, knowledge, history);
    }

    const content = await callGroqAPI(systemPrompt, userPrompt);

    if (!content) {
      // Groq call failed, use mock advice
      return generateMockAdvice(car, question, knowledge, history);
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const advice = JSON.parse(jsonMatch ? jsonMatch[0] : content);

    return advice;
  } catch (err) {
    console.error("AI Advice Error:", err.message);
    // Return fallback structured response
    return generateMockAdvice(car, question, knowledge, history);
  }
}

function generateMockAdvice(car, question, knowledge, history = { maintenance: [], mods: [] }) {
  const doneMaintenanceTypes = new Set(
    (history.maintenance || [])
      .map((m) => String(m.type || "").trim().toLowerCase())
      .filter(Boolean)
  );
  const doneModParts = new Set(
    (history.mods || [])
      .map((m) => String(m.part || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const maintenanceAdvice = [];
  if (!doneMaintenanceTypes.has("oil change")) {
    maintenanceAdvice.push({
      title: "Oil Change",
      priority: 1,
      why: "Regular oil changes keep your engine healthy",
      when: "Every 5,000-7,000 miles",
      est_cost: "£",
    });
  }

  if (!doneMaintenanceTypes.has("filter replacement")) {
    maintenanceAdvice.push({
      title: "Filter Replacement",
      priority: 2,
      why: "Air and cabin filters improve performance",
      when: "Every 12,000-15,000 miles",
      est_cost: "£",
    });
  }

  if (maintenanceAdvice.length === 0) {
    maintenanceAdvice.push({
      title: "Routine Inspection",
      priority: 3,
      why: "Your logged maintenance looks up to date, so a condition check is the safest next step",
      when: "At next service interval",
      est_cost: "£",
    });
  }

  const modAdvice = [];
  if (!doneModParts.has("better tires")) {
    modAdvice.push({
      title: "Better Tires",
      priority: 1,
      why: "Quality tires improve safety and handling",
      requires: [],
      risks: "Ensure proper wheel alignment after installation",
      est_cost: "££",
    });
  }

  if (modAdvice.length === 0) {
    modAdvice.push({
      title: "Alignment and Setup Check",
      priority: 2,
      why: "Since you already have core mods logged, optimize setup before adding more parts",
      requires: [],
      risks: "Skipping setup checks can reduce handling and tire life",
      est_cost: "£",
    });
  }

  return {
    summary: `Based on your ${car.year} ${car.make} ${car.model}, here are recommendations for "${question}". I considered ${history.maintenance?.length || 0} logged maintenance item(s) and ${history.mods?.length || 0} logged mod(s). AI responses are currently in demo mode.`,
    maintenance: maintenanceAdvice,
    mods: modAdvice,
    checks: [
      "What's your current mileage?",
      "Are there any warning lights?",
      "What type of driving do you mostly do?",
    ],
    disclaimer:
      "This is a demo response. For personalized advice, please add your GROQ_API_KEY to .env",
  };
}

module.exports = {
  generateAiAdvice,
  retrieveKnowledge,
  getCarHistory,
  generateCarModPreview,
};

function getHfClient(hfApiKey) {
  if (!hfApiKey) return null;
  if (!hfClient) {
    hfClient = new InferenceClient(hfApiKey);
  }
  return hfClient;
}

function dataUriToBlob(dataUri) {
  const value = String(dataUri || "");
  const match = value.match(/^data:(.+?);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid base image format for image-to-image generation.");
  }

  const mimeType = match[1] || "image/png";
  const base64Payload = match[2] || "";
  const imageBuffer = Buffer.from(base64Payload, "base64");
  return new Blob([imageBuffer], { type: mimeType });
}

async function callHfModel(model, hfApiKey, task, attemptFallback = true, fallbackModel = null) {
  const client = getHfClient(hfApiKey);
  if (!client) {
    throw new Error("HF_API_KEY not set. Add it to backend .env to enable visual previews.");
  }

  const provider = String(process.env.HF_IMAGE_PROVIDER || "auto").trim() || "auto";

  try {
    if (task.type === "image-to-image") {
      const outputBlob = await client.imageToImage({
        model,
        provider,
        inputs: dataUriToBlob(task.imageDataUri),
        parameters: {
          prompt: task.prompt,
          negative_prompt: task.negativePrompt,
          num_inference_steps: task.numInferenceSteps,
          guidance_scale: task.guidanceScale,
        },
      });

      return Buffer.from(await outputBlob.arrayBuffer());
    }

    const outputBlob = await client.textToImage({
      model,
      provider,
      inputs: task.prompt,
      parameters: {
        negative_prompt: task.negativePrompt,
        num_inference_steps: task.numInferenceSteps,
        guidance_scale: task.guidanceScale,
      },
    });

    return Buffer.from(await outputBlob.arrayBuffer());
  } catch (err) {
    const message = String(err?.message || err || "Image generation failed");
    if (message.toLowerCase().includes("sufficient permissions to call inference providers")) {
      throw new Error(
        "Hugging Face token lacks Inference Providers permission. Create a User Access Token with Inference Providers scope, or use a model/provider your token is allowed to call."
      );
    }

    if (message.toLowerCase().includes("depleted your monthly included credits")) {
      if (attemptFallback && task.type === "image-to-image" && fallbackModel) {
        console.warn(
          "[HF Preview] Credits depleted, falling back to text-to-image with car context using fallback model"
        );
        const textOnlyTask = {
          type: "text-to-image",
          prompt: task.prompt + " Based on the uploaded car photo.",
          negativePrompt: task.negativePrompt,
          numInferenceSteps: 28,
          guidanceScale: 4.5,
        };
        return callHfModel(fallbackModel, hfApiKey, textOnlyTask, false);
      }
      throw new Error(
        "Hugging Face Inference Providers credits are depleted. Text-to-image fallback also failed. Add pre-paid credits, upgrade to PRO, or wait for monthly credit reset."
      );
    }

    if (task.type === "image-to-image" && message.toLowerCase().includes("model not supported")) {
      throw new Error(
        `Model ${model} is not available for image-to-image on provider ${provider}. Use an image-edit model such as black-forest-labs/FLUX.1-Kontext-dev or choose another provider.`
      );
    }

    throw new Error(message);
  }
}

async function generateCarModPreview(car, plannedItem, basePhotoUrl) {
  const hfApiKey = process.env.HF_API_KEY;
  const hfModel = process.env.HF_IMAGE_MODEL || "black-forest-labs/FLUX.1-Kontext-dev";
  const fallbackModel = (process.env.HF_FALLBACK_IMAGE_MODEL || "").trim();
  const configuredMode = String(process.env.HF_IMAGE_MODE || "image-to-image")
    .trim()
    .toLowerCase();
  const useImageToImage = configuredMode !== "text-to-image";

  if (!hfApiKey) {
    throw new Error("HF_API_KEY not set. Add it to backend .env to enable visual previews.");
  }

  if (!basePhotoUrl) {
    throw new Error("No base photo available. Upload at least one car photo first.");
  }

  const baseImageResponse = await fetch(basePhotoUrl);
  if (!baseImageResponse.ok) {
    throw new Error("Could not download the selected base photo for preview generation.");
  }

  const baseImageBuffer = await baseImageResponse.arrayBuffer();
  const base64Image = Buffer.from(baseImageBuffer).toString("base64");
  const base64ImageDataUri = `data:image/png;base64,${base64Image}`;

  const modSummary = [plannedItem.title, plannedItem.why, plannedItem.requires?.join(", "), plannedItem.risks]
    .filter(Boolean)
    .join(". ");

  const basePrompt = `Edit this exact car photo to visualize the requested modification while preserving the same camera angle, paint color, body shape, and lighting.
Car: ${car.year} ${car.make} ${car.model}.
Requested modification: ${modSummary}.
Make the result photorealistic and subtle. Do not add text, watermarks, logos, or extra cars/background elements.`;

  const enrichedPrompt = `${basePrompt}

Reference car details: ${car.year} ${car.make} ${car.model} with ${car.mileage ? car.mileage + " miles" : "unknown mileage"}.`;

  const attempts = [
    {
      model: hfModel,
      task: useImageToImage
        ? {
            type: "image-to-image",
            imageDataUri: base64ImageDataUri,
            prompt: enrichedPrompt,
            negativePrompt: "watermark, text overlay, logo, extra cars",
            numInferenceSteps: 30,
            guidanceScale: 6,
          }
        : {
            type: "text-to-image",
            prompt: `${enrichedPrompt} Keep a similar style and perspective to the uploaded source photo.`,
            negativePrompt: "watermark, text overlay, logo, extra cars",
            numInferenceSteps: 28,
            guidanceScale: 4.5,
          },
    },
  ];

  if (fallbackModel && fallbackModel !== hfModel) {
    attempts.push({
      model: fallbackModel,
      task: useImageToImage
        ? {
            type: "image-to-image",
            imageDataUri: base64ImageDataUri,
            prompt: enrichedPrompt,
            negativePrompt: "watermark, text overlay, logo, extra cars",
            numInferenceSteps: 28,
            guidanceScale: 6,
          }
        : {
            type: "text-to-image",
            prompt: `${enrichedPrompt} Keep a similar style and perspective to the uploaded source photo.`,
            negativePrompt: "watermark, text overlay, logo, extra cars",
            numInferenceSteps: 28,
            guidanceScale: 4.5,
          },
    });
  }

  let generatedBuffer = null;
  let lastErr = null;

  for (const attempt of attempts) {
    try {
      generatedBuffer = await callHfModel(attempt.model, hfApiKey, attempt.task, true, fallbackModel);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`[HF Preview] Attempt failed for ${attempt.model}:`, err.message);
    }
  }

  if (!generatedBuffer) {
    throw new Error(lastErr?.message || "Image generation failed");
  }

  const uploadResult = await cloudinary.uploader.upload(
    `data:image/png;base64,${generatedBuffer.toString("base64")}`,
    {
    folder: "fullstack-car-app/previews",
    resource_type: "image",
    }
  );

  return {
    previewUrl: uploadResult.secure_url,
    previewMessage: `AI preview generated from your uploaded car photo using ${hfModel}.`,
  };
}
