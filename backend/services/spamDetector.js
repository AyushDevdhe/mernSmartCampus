const {
  profanityList,
  spamPatterns,
  gibberishPattern,
} = require("../utils/profanityList");
const queryModel = require("../models/queryModel");

// Calculate spam score (0-100)
const detectSpam = async (title, description, userId) => {
  let spamScore = 0;
  let reasons = [];
  const text = `${title} ${description}`.toLowerCase();

  // 0. IMMEDIATE BLOCK for explicit content
const explicitPatterns =
  /(sex|sexy|fuck|dick|cock|pussy|naked|nude|porn|chut|chutiya|bhosdi|madarchod|behenchod|gandu|lund|bhadva|lavda)/i;
if (explicitPatterns.test(text)) {
  spamScore = 100;
  reasons.push("🚫 Explicit/inappropriate content detected - Policy violation");
  return {
    isSpam: true,
    isSuspicious: false,
    score: 100,
    level: "spam",
    reasons: reasons,
    shouldBlock: true,
  };
}


  // 1. Check for profanity (50 points)
  const foundProfanity = profanityList.filter((word) => text.includes(word));
  if (foundProfanity.length > 0) {
    spamScore = 100;
    reasons.push(
      `🚫 Inappropriate language detected: ${foundProfanity.slice(0, 3).join(", ")}`,
    );
    reasons.push("Query blocked due to policy violation");
    return {
      isSpam: true,
      isSuspicious: false,
      score: 100,
      level: "spam",
      reasons: reasons,
      shouldBlock: true,
    };
  }

  // 2. Check for spam patterns (15 points)
  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      spamScore += 15;
      reasons.push("Contains suspicious patterns");
      break;
    }
  }

  // 3. Check for gibberish (15 points)
  if (gibberishPattern.test(description.replace(/\s/g, ""))) {
    spamScore += 15;
    reasons.push("Gibberish content detected");
  }

  // 4. Check for very short description (10 points)
  if (description.trim().length < 15) {
    spamScore += 10;
    reasons.push("Description too short");
  }

  // 5. Check for excessive uppercase (10 points)
  const upperCaseCount = (description.match(/[A-Z]/g) || []).length;
  if (upperCaseCount > description.length * 0.5) {
    spamScore += 10;
    reasons.push("Excessive uppercase text");
  }

  // 6. Check for duplicate query by same user (20 points)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentQueries = await queryModel.find({
    user: userId,
    title: title,
    createdAt: { $gte: oneHourAgo },
  });
  if (recentQueries.length > 0) {
    spamScore += 20;
    reasons.push(
      `Duplicate query submitted ${recentQueries.length} time(s) in last hour`,
    );
  }

  // 7. Check for same query from different users (25 points)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const similarQueries = await queryModel.find({
    title: title,
    description: description,
    createdAt: { $gte: last24Hours },
  });
  if (similarQueries.length > 3) {
    spamScore += 25;
    reasons.push(
      `Potential spam attack: ${similarQueries.length} identical queries in 24 hours`,
    );
  }


  const hinglishCasualPatterns = [
    /accha toh hum chalte hai/i,
    /chalo yaar/i,
    /kya haal hai/i,
    /mast hai/i,
    /timepass/i,
    /maza aaya/i,
    /badhiya/i,
    /awesome/i,
    /cool/i,
    /just like that/i,
    /acha hai/i,
    /thik hai/i,
    /chill/i,
    /relax/i,
    /hangout/i,
    /fun karte hai/i,
    /party karte hai/i,
  ];

  for (const pattern of hinglishCasualPatterns) {
    if (pattern.test(text)) {
      spamScore += 35;
      reasons.push("Casual conversation detected, not a genuine campus issue");
      break;
    }
  }

  // New: Check if query has meaningful action words (what needs to be fixed)
  const actionWords =
    /(down|not working|error|issue|problem|complaint|fix|repair|broken|slow|not connecting|not opening|not accessible|facing|unable|cannot|unable to|issue with|problem with)/i;
    
  const hasActionWord = actionWords.test(text);

  // New: Check for specific campus issue keywords
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

const hasCampusKeyword = campusKeywords.some((keyword) =>
  text.includes(keyword),
);

// If no action word and no campus keyword, mark as suspicious
if (!hasActionWord && !hasCampusKeyword && description.length > 15) {
  spamScore += 30;
  reasons.push("Query doesn't describe a specific problem that needs fixing");
}

  // 9. Check for casual/non-issue content
  const casualPatterns = [
    /lets have fun/i,
    /let's have fun/i,
    /enjoy/i,
    /party/i,
    /what's up/i,
    /how are you/i,
    /hello/i,
    /hi there/i,
    /just saying/i,
    /for no reason/i,
    /random/i,
  ];

  for (const pattern of casualPatterns) {
    if (pattern.test(text)) {
      spamScore += 30;
      reasons.push("Query appears to be casual chat, not a genuine issue");
      break;
    }
  }

  // Determine spam level
  let level = "clean";
  if (spamScore >= 50) level = "spam";
  else if (spamScore >= 25) level = "suspicious";

  return {
    isSpam: spamScore >= 50,
    isSuspicious: spamScore >= 25 && spamScore < 50,
    score: Math.min(spamScore, 100),
    level: level,
    reasons: reasons,
    shouldBlock: spamScore >= 50,
  };
};;

module.exports = { detectSpam };
