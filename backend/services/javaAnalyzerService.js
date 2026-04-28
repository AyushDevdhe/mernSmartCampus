const net = require("net");

const JAVA_SERVER_HOST = "localhost";
const JAVA_SERVER_PORT = 6000;

const analyzeWithJava = (description) => {
  return new Promise((resolve) => {
    const client = new net.Socket();
    let responseData = "";

    const timeout = setTimeout(() => {
      client.destroy();
      console.log("Java analyzer timeout - using fallback");
      resolve({ priority: "Medium", score: 0, matches: [], fallback: true });
    }, 5000);

    client.connect(JAVA_SERVER_PORT, JAVA_SERVER_HOST, () => {
      console.log("Connected to Java analyzer, sending request...");
      client.write(`ANALYZE:${encodeURIComponent(description)}\n`);
    });

    client.on("data", (data) => {
      responseData += data.toString();
      console.log("Raw Java response:", responseData);

      try {
        // Find JSON object in response
        const match = responseData.match(/\{[^{}]*\}/);
        if (match) {
          // Fix matches array - Java sends [urgent] which is not valid JSON
          let jsonStr = match[0];
          // Convert [urgent] to ["urgent"]
          jsonStr = jsonStr.replace(/\[([a-zA-Z_,]+)\]/g, (match) => {
            const items = match.slice(1, -1).split(",");
            const quoted = items.map((item) => `"${item.trim()}"`);
            return `[${quoted.join(",")}]`;
          });

          const result = JSON.parse(jsonStr);
          console.log("Parsed Java result:", result);
          clearTimeout(timeout);
          resolve({
            priority: result.priority || "Medium",
            score: result.score || 0,
            matches: result.matches || [],
            fallback: false,
          });
        } else {
          resolve({
            priority: "Medium",
            score: 0,
            matches: [],
            fallback: true,
          });
        }
      } catch (err) {
        console.log("Parse error:", err.message);
        resolve({ priority: "Medium", score: 0, matches: [], fallback: true });
      }
      client.destroy();
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      console.log("Java analyzer error:", err.message);
      resolve({ priority: "Medium", score: 0, matches: [], fallback: true });
    });
  });
};

module.exports = { analyzeWithJava };
