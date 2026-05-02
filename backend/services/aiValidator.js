const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const validateQueryRelevance = async (title, description) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are an AI validator for a campus query management system. Analyze the following student query.

      === QUERY ===
      Title: ${title}
      Description: ${description}
      ==============

      IMPORTANT RULES:
      1. Evaluate BOTH title AND description together — title alone is NOT enough.
      2. The description must clearly explain an ACTUAL problem the student is facing RIGHT NOW.
      3. Watch for NEGATION — "Wifi is not down but I want to add a query" means there is NO problem. BLOCK IT.
      4. Watch for HEDGING — "I just want to add", "testing", "checking" = not a real issue. BLOCK IT.
      5. A genuine issue must be something a supervisor can ACT ON and FIX.
      6. "Are you coming? Lets go" under title "Electrical" is NOT genuine.
      7. "Wifi is not down but I want to add a query" is NOT genuine — student admitted there is no issue.

      CLASSIFY as one of three tiers:
      - "genuine": Real campus problem, supervisor can take action
      - "soft_block": Not malicious but not a real issue (negation, vague, "just testing", "I want to add a query", no actual problem stated)
      - "fake": Clearly irrelevant, casual chat, timepass, nonsense

      Analyze and return ONLY valid JSON (no markdown, no backticks, no preamble):
      {
        "isGenuine": true/false,
        "tier": "genuine" | "soft_block" | "fake",
        "relevanceScore": 0-100,
        "confidence": 0-100,
        "category": "Wi-Fi|Electrical|Safety|ERP|Library|Staff|Hostel|Exam|Fee|Other|Fake",
        "reason": "brief 1-line explanation of your decision",
        "keyIssues": ["issue1", "issue2"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const cleaned = response.replace(/```json|```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("🤖 Gemini AI Analysis:", parsed);
      return parsed;
    }

    console.warn("⚠️ Gemini returned non-JSON, using strict fallback");
    return fallbackValidation(title, description);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    return fallbackValidation(title, description);
  }
};

const fallbackValidation = (title, description) => {
  const titleText = title.toLowerCase();
  const descText = description.toLowerCase();
  const combinedText = `${titleText} ${descText}`;

  const negationPatterns = [
    "is not down",
    "is not broken",
    "is not an issue",
    "is working fine",
    "but i want to add",
    "just want to add a query",
    "just testing",
    "checking if this works",
    "want to add a query",
    "i want to add",
    "no issue",
    "no problem",
    "everything is fine",
    "just to check",
  ];

  const fakePatterns = [
    "lets go",
    "let's go",
    "are you coming",
    "party",
    "chill",
    "hangout",
    "what's up",
    "how are you",
    "hi there",
    "hey guys",
    "just saying",
    "random",
    "chalo",
    "masti",
    "timepass",
    "fun time",
    "testing 123",
    "abc",
    "asdf",
    "dummy",
    "haha",
    "lol",
    "lmao",
    "xd",
    "ok bye",
  ];

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

  const hasNegation = negationPatterns.some((p) => combinedText.includes(p));
  const isFake = fakePatterns.some((p) => combinedText.includes(p));
  const hasCampusTopic = campusTopics.some((p) => combinedText.includes(p));
  const descriptionShowsProblem = genuineDescriptionPatterns.some((p) =>
    descText.includes(p),
  );
  const descriptionTooShort = description.trim().length < 20;

  if (hasNegation) {
    return {
      isGenuine: false,
      tier: "soft_block",
      relevanceScore: 30,
      confidence: 85,
      category: "Other",
      reason:
        "Student indicated there is no actual problem — not a genuine issue",
      keyIssues: ["Negation detected — no real problem stated"],
    };
  }

  if (isFake) {
    return {
      isGenuine: false,
      tier: "fake",
      relevanceScore: 5,
      confidence: 90,
      category: "Fake",
      reason: "Query contains casual conversation or non-campus content",
      keyIssues: ["Casual language detected"],
    };
  }

  if (descriptionTooShort) {
    return {
      isGenuine: false,
      tier: "soft_block",
      relevanceScore: 15,
      confidence: 80,
      category: "Other",
      reason: "Description too short to describe a real campus issue",
      keyIssues: ["Minimum description length not met"],
    };
  }

  if (hasCampusTopic && !descriptionShowsProblem) {
    return {
      isGenuine: false,
      tier: "soft_block",
      relevanceScore: 20,
      confidence: 85,
      category: "Other",
      reason:
        "Title has campus keyword but description does not describe an actionable problem",
      keyIssues: ["Description lacks any problem statement"],
    };
  }

  if (hasCampusTopic && descriptionShowsProblem) {
    return {
      isGenuine: true,
      tier: "genuine",
      relevanceScore: 75,
      confidence: 65,
      category: "Other",
      reason: "Query contains campus topic and a problem description",
      keyIssues: [],
    };
  }

  return {
    isGenuine: false,
    tier: "fake",
    relevanceScore: 20,
    confidence: 70,
    category: "Fake",
    reason: "Query does not mention any campus-related issue",
    keyIssues: ["No campus keywords detected"],
  };
};

module.exports = { validateQueryRelevance };
