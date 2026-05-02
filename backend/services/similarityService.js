const { pipeline } = require("@xenova/transformers");

let embedder = null;

const getEmbedder = async () => {
  if (!embedder) {
    console.log(
      "🤖 Loading AI similarity model (first time may take a moment)...",
    );
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ AI similarity model loaded");
  }
  return embedder;
};

const generateEmbedding = async (text) => {
  try {
    const embedderModel = await getEmbedder();
    const result = await embedderModel(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(result.data);
  } catch (error) {
    console.error("Embedding generation error:", error);
    return null;
  }
};

const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const findSimilarQueries = async (
  targetQuery,
  allQueries,
  threshold = 0.5,
  type = "resolved",
) => {
  const targetText = `${targetQuery.title} ${targetQuery.description}`;
  const targetEmbedding = await generateEmbedding(targetText);

  if (!targetEmbedding) return [];

  const results = [];

  for (const query of allQueries) {
    if (query._id.toString() === targetQuery._id.toString()) continue;

    const queryText = `${query.title} ${query.description}`;
    let similarity = 0;

    if (query.embedding) {
      similarity = cosineSimilarity(targetEmbedding, query.embedding);
    } else {
      const queryEmbedding = await generateEmbedding(queryText);
      if (queryEmbedding) {
        query.embedding = queryEmbedding;
        await query.save();
        similarity = cosineSimilarity(targetEmbedding, queryEmbedding);
      }
    }

    if (similarity >= threshold) {
      const result = {
        _id: query._id,
        title: query.title,
        description: query.description,
        status: query.status,
        priority: query.priority,
        similarity: Math.round(similarity * 100),
        resolvedBy: query.assignedTo?.firstName || "Auto-resolved",
        resolutionDate: query.updatedAt,
        adminAction: query.adminAction,
      };

      // Add extra fields for resolved queries (stats)
      if (type === "resolved") {
        result.resolutionNote =
          query.resolutionNote || "Resolved by supervisor";
        result.resolutionTime = calculateResolutionTime(
          query.createdAt,
          query.updatedAt,
        );
      }

      results.push(result);
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, 10);
};

const calculateResolutionTime = (createdAt, updatedAt) => {
  const diffHours =
    (new Date(updatedAt) - new Date(createdAt)) / (1000 * 60 * 60);
  if (diffHours < 24) return `${Math.round(diffHours)} hours`;
  return `${Math.round(diffHours / 24)} days`;
};

module.exports = { generateEmbedding, findSimilarQueries };
