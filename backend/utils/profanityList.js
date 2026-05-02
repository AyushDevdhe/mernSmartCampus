// Comprehensive profanity and spam keywords list
const profanityList = [
  // English profanity (existing)
  "fuck", "shit", "asshole", "bitch", "damn", "hell", "crap",
  "stupid", "idiot", "moron", "loser", "useless", "waste",
  "kill", "death", "hate", "suck", "terrible", "worst",
  
  // Sexual content
  "sex", "sexy", "fuck", "fucking", "suck", "sucking", "cock", "dick",
  "pussy", "ass", "boobs", "tits", "breast", "naked", "nude",
  "porn", "xxx", "masturbate", "orgasm", "penis", "vagina",
  
  // Hindi/Hinglish profanity
  "chut", "chutiya", "bhosdi", "bhosdike", "madarchod", "behenchod",
  "gandu", "lund", "bhadva", "harami", "kamina", "saala", "bakkwas",
  "randi", "kutti", "hijda", "lavda", "gand", "choda", "chodna",
  
  // Hindi/Hinglish negative words
  "bevakoof", "pagal", "sala", "ullu", "pataka", "badtameez",
  
  // Drugs/alcohol
  "weed", "cannabis", "alcohol", "beer", "wine", "cigarette", "smoke",
  "daaru", "sharab", "ganja", "bhang", "nasha", "cigarette",
  
  // Violence
  "bomb", "terrorist", "attack", "shoot", "gun", "knife", "blood",
  "murder", "rape", "abuse", "harass", "bully", "maar", "pitai", "jhagda"
];

const spamPatterns = [
  /[0-9]{10,}/g, // phone numbers
  /www\./gi, // website links
  /http:/gi, // http links
  /https:/gi, // https links
  /[!@#$%^&*]{5,}/g, // excessive symbols
  /(.)\1{5,}/g, // repeated characters (aaaaaa)
  /viagra|cialis|casino|lottery|prize/gi, // common spam words
];

const gibberishPattern = /^[a-zA-Z]{20,}$/; // long random text

module.exports = { profanityList, spamPatterns, gibberishPattern };
