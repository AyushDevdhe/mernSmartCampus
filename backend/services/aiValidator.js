const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const validateQueryRelevance = async (title, description) => {
  try {
    // FIX 1: gemini-pro is deprecated — use gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI validator for a campus query management system. Analyze the following student query.

      === QUERY ===
      Title: ${title}
      Description: ${description}
      ==============

      IMPORTANT: Evaluate BOTH the title AND description together.
      - The title alone having a valid campus keyword is NOT enough.
      - The description must also describe a REAL, SPECIFIC, ACTIONABLE campus problem.
      - "Are you coming? Lets go" under title "Electrical" is NOT a genuine query — it is casual conversation.

      A GENUINE campus issue must:
      1. Have a description that clearly explains the actual problem (not just a keyword in the title)
      2. Be SPECIFIC and ACTIONABLE (something that can be fixed or addressed by staff)
      3. NOT be casual conversation, fun activities, general chat, or irrelevant content
      4. NOT be fake, nonsense, test submissions, or promotional

      Analyze and return ONLY valid JSON (no markdown, no backticks, no preamble):
      {
        "isGenuine": true/false,
        "relevanceScore": 0-100,
        "confidence": 0-100,
        "category": "Wi-Fi|Electrical|Safety|ERP|Library|Staff|Hostel|Exam|Fee|Other|Fake",
        "reason": "brief 1-line explanation of your decision",
        "keyIssues": ["issue1", "issue2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Strip markdown code blocks if present
    const cleaned = response.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("🤖 Gemini AI Analysis:", parsed);
      return parsed;
    }

    // If JSON parsing fails, conservative fallback
    console.warn("⚠️ Gemini returned non-JSON response, using strict fallback");
    return fallbackValidation(title, description);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    // FIX 3: Don't silently allow on error — use strict fallback
    return fallbackValidation(title, description);
  }
};

// FIX 2: Fallback now validates description independently, not just combined text
const fallbackValidation = (title, description) => {
  const titleText = title.toLowerCase();
  const descText = description.toLowerCase();
  const combinedText = `${titleText} ${descText}`;

  // Genuine campus issue keywords — must appear in DESCRIPTION, not just title
  const genuineDescriptionPatterns = [
    "not working",
    "down",
    "issue",
    "problem",
    "complaint",
    "facing",
    "error",
    "broken",
    "offline",
    "slow",
    "no signal",
    "disconnected",
    "damaged",
    "flooded",
    "leaking",
    "blocked",
    "pending",
    "failed",
    "request",
    "need help",
    "unable to",
    "can't access",
    "cannot",
    "please fix",
    "need to report",
    "reporting",
    "concern",
  ];

  // Campus topic keywords — should appear somewhere (title or description)
  const campusTopics = [
    "wifi",
    "wi-fi",
    "network",
    "internet",
    "speed",
    "connection",
    "electrical",
    "power",
    "light",
    "fan",
    "bulb",
    "fuse",
    "short circuit",
    "safety",
    "security",
    "cctv",
    "guard",
    "gate",
    "erp",
    "portal",
    "website",
    "login",
    "password",
    "access",
    "library",
    "book",
    "return",
    "borrow",
    "late fee",
    "staff",
    "teacher",
    "professor",
    "behavior",
    "rude",
    "hostel",
    "room",
    "water",
    "ac",
    "cooler",
    "clean",
    "mess",
    "food",
    "exam",
    "result",
    "marks",
    "recheck",
    "admit card",
    "fee",
    "payment",
    "scholarship",
    "receipt",
  ];

  // Casual / fake patterns
  const fakePatterns = [
    "lets go",
    "let's go",
    "are you coming",
    "are you comming",
    "party",
    "chill",
    "hangout",
    "play",
    "game",
    "what's up",
    "how are you",
    "hello",
    "hi there",
    "hey guys",
    "just saying",
    "random",
    "nothing",
    "just like that",
    "chalo",
    "masti",
    "timepass",
    "enjoy",
    "fun time",
    "test",
    "testing 123",
    "abc",
    "asdf",
    "dummy",
    "haha",
    "lol",
    "lmao",
    "xd",
    "ok bye",
    "bye",
  ];

  const hasCampusTopic = campusTopics.some((p) => combinedText.includes(p));
  // FIX: Description must independently show there's a real problem
  const descriptionShowsProblem = genuineDescriptionPatterns.some((p) =>
    descText.includes(p),
  );
  const isFake = fakePatterns.some((p) => combinedText.includes(p));
  const descriptionTooShort = description.trim().length < 20;

  // Explicit fake content detected
  if (isFake) {
    return {
      isGenuine: false,
      relevanceScore: 5,
      confidence: 90,
      category: "Fake",
      reason: "Query contains casual conversation or non-campus content",
      keyIssues: ["Casual language detected in description"],
    };
  }

  // Description is too short to be a real complaint
  if (descriptionTooShort) {
    return {
      isGenuine: false,
      relevanceScore: 15,
      confidence: 80,
      category: "Fake",
      reason: "Description is too short to describe a real campus issue",
      keyIssues: ["Description must be at least 20 characters"],
    };
  }

  // Has campus topic BUT description doesn't describe an actual problem
  // (e.g., title = "Electrical", desc = "Are you coming? Lets go")
  if (hasCampusTopic && !descriptionShowsProblem) {
    return {
      isGenuine: false,
      relevanceScore: 20,
      confidence: 85,
      category: "Fake",
      reason:
        "Title has campus keyword but description does not describe an actionable problem",
      keyIssues: ["Description lacks any problem statement"],
    };
  }

  // Both topic and problem description present — likely genuine
  if (hasCampusTopic && descriptionShowsProblem) {
    return {
      isGenuine: true,
      relevanceScore: 75,
      confidence: 65,
      category: "Other",
      reason: "Query contains campus topic and a problem description",
      keyIssues: [],
    };
  }

  // No campus topic at all
  return {
    isGenuine: false,
    relevanceScore: 20,
    confidence: 70,
    category: "Fake",
    reason: "Query does not mention any campus-related issue",
    keyIssues: ["No campus keywords detected"],
  };
};

module.exports = { validateQueryRelevance };
