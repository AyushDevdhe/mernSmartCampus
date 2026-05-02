const {
  profanityList,
  spamPatterns,
  gibberishPattern,
} = require("../utils/profanityList");
const queryModel = require("../models/queryModel");

// ── TIER 3 patterns (offensive/sexual/racist/curse) ──────────
const tier3ExplicitPatterns =
  /(sex|sexy|fuck|f\*ck|f\*\*k|fu\*k|dick|d\*ck|cock|c\*ck|pussy|p\*ssy|naked|nude|porn|p\*rn|@\$\$|a\$\$|sh\*t|b\*tch|bitch|bastard|chut|chutiya|bhosdi|madarchod|behenchod|gandu|lund|bhadva|lavda|rape|molest|harass|nigger|racist|slut|wh\*re|whore)/i;

const campusKeywords = [
  "wifi",
  "wi-fi",
  "network",
  "internet",
  "electrical",
  "power",
  "light",
  "fan",
  "safety",
  "security",
  "cctv",
  "guard",
  "erp",
  "portal",
  "website",
  "login",
  "library",
  "book",
  "staff",
  "teacher",
  "professor",
  "class",
  "exam",
  "result",
  "fee",
  "payment",
  "scholarship",
  "hostel",
  "room",
  "water",
  "ac",
  "cooler",
  "bathroom",
  "toilet",
  "clean",
  "cleaning",
  "maintenance",
  "repair",
];

const actionWords =
  /(down|not working|error|issue|problem|complaint|fix|repair|broken|slow|not connecting|not opening|not accessible|facing|unable|cannot|unable to|issue with|problem with)/i;

const hinglishCasualPatterns = [
  /accha toh hum chalte hai/i,
  /chalo yaar/i,
  /kya haal hai/i,
  /mast hai/i,
  /timepass/i,
  /maza aaya/i,
  /badhiya/i,
  /just like that/i,
  /acha hai/i,
  /thik hai/i,
  /chill karte/i,
  /hangout/i,
  /fun karte hai/i,
  /party karte hai/i,
];

const casualPatterns = [
  /lets have fun/i,
  /let's have fun/i,
  /what's up/i,
  /how are you/i,
  /hi there/i,
  /hey guys/i,
  /just saying/i,
  /for no reason/i,
];

const detectSpam = async (title, description, userId) => {
  const text = `${title} ${description}`.toLowerCase();

  // ── TIER 3 CHECK ─────────────────────────────────────────
  if (tier3ExplicitPatterns.test(text)) {
    return {
      tier: 3,
      isSpam: true,
      isSuspicious: false,
      score: 100,
      level: "offensive",
      reasons: [
        "Explicit/offensive/racist content detected — zero tolerance policy violation",
      ],
      shouldBlock: true,
    };
  }

  const foundProfanity = profanityList.filter((word) => text.includes(word));
  if (foundProfanity.length > 0) {
    return {
      tier: 3,
      isSpam: true,
      isSuspicious: false,
      score: 100,
      level: "offensive",
      reasons: [
        `Inappropriate language detected: ${foundProfanity.slice(0, 3).join(", ")}`,
      ],
      shouldBlock: true,
    };
  }

  // ── TIER 2 SCORING ────────────────────────────────────────
  let spamScore = 0;
  let reasons = [];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      spamScore += 15;
      reasons.push("Contains suspicious patterns");
      break;
    }
  }

  if (gibberishPattern.test(description.replace(/\s/g, ""))) {
    spamScore += 15;
    reasons.push("Gibberish content detected");
  }

  if (description.trim().length < 15) {
    spamScore += 10;
    reasons.push("Description too short");
  }

  const upperCaseCount = (description.match(/[A-Z]/g) || []).length;
  if (upperCaseCount > description.length * 0.5) {
    spamScore += 10;
    reasons.push("Excessive uppercase text");
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentQueries = await queryModel.find({
    user: userId,
    title,
    createdAt: { $gte: oneHourAgo },
  });
  if (recentQueries.length > 0) {
    spamScore += 20;
    reasons.push(
      `Duplicate query submitted ${recentQueries.length} time(s) in last hour`,
    );
  }

  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const similarQueries = await queryModel.find({
    title,
    description,
    createdAt: { $gte: last24Hours },
  });
  if (similarQueries.length > 3) {
    spamScore += 25;
    reasons.push(
      `Spam flood: ${similarQueries.length} identical queries in 24 hours`,
    );
  }

  for (const pattern of hinglishCasualPatterns) {
    if (pattern.test(text)) {
      spamScore += 35;
      reasons.push("Casual conversation detected");
      break;
    }
  }

  for (const pattern of casualPatterns) {
    if (pattern.test(text)) {
      spamScore += 30;
      reasons.push("Casual chat detected");
      break;
    }
  }

  const hasCampusKeyword = campusKeywords.some((kw) => text.includes(kw));
  const hasActionWord = actionWords.test(text);
  if (!hasActionWord && !hasCampusKeyword && description.length > 15) {
    spamScore += 30;
    reasons.push("No campus issue keywords detected");
  }

  const isSpam = spamScore >= 50;
  const isSuspicious = spamScore >= 25 && spamScore < 50;

  return {
    tier: isSpam ? 2 : 1,
    isSpam,
    isSuspicious,
    score: Math.min(spamScore, 100),
    level: isSpam ? "spam" : isSuspicious ? "suspicious" : "clean",
    reasons: reasons.length > 0 ? reasons : ["No issues detected"],
    shouldBlock: isSpam,
  };
};

module.exports = { detectSpam };
