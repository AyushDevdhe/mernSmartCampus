package com.smartcampus;

import java.util.*;
import java.util.stream.Collectors;
import java.io.*;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;

public class QueryAnalyzer {

    private static final String[] URGENT_KEYWORDS = {
            "urgent", "emergency", "critical", "immediate", "asap", "quick",
            "fast", "important", "blocked", "stuck", "not working", "down",
            "error", "failed", "issue", "problem", "broken", "crash"
    };

    private static final String[] HIGH_PRIORITY_KEYWORDS = {
            "high", "severe", "major", "serious", "danger", "security",
            "data loss", "hack", "breach", "unauthorized"
    };

    private static final String[] LOW_PRIORITY_KEYWORDS = {
            "suggestion", "feature request", "improvement", "enhancement",
            "idea", "future", "minor", "small"
    };

    public static void main(String[] args) {
        startServer();
    }

    public static void startServer() {
        int port = 6000;
        System.out.println("🔍 Java Query Analyzer Server Started on port " + port);
        System.out.println("Analyzing query descriptions for urgency...");
        System.out.println("Waiting for connections from Node.js backend...");

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            while (true) {
                try (Socket clientSocket = serverSocket.accept()) {
                    System.out.println("📡 Client connected: " + clientSocket.getInetAddress());

                    BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                    PrintWriter out = new PrintWriter(clientSocket.getOutputStream(), true);

                    String request = in.readLine();
                    if (request != null && request.startsWith("ANALYZE:")) {
                        String description = request.substring(8);
                        description = URLDecoder.decode(description, "UTF-8");

                        String result = analyzeDescription(description);
                        out.println(result);
                        System.out.println("✅ Analyzed: \""
                                + description.substring(0, Math.min(50, description.length())) + "...\" → " + result);
                    } else {
                        out.println("{\"error\":\"Invalid request format\"}");
                    }
                } catch (IOException e) {
                    System.err.println("Error handling client: " + e.getMessage());
                }
            }
        } catch (IOException e) {
            System.err.println("Server error: " + e.getMessage());
        }
    }

    public static String analyzeDescription(String description) {
        String lowerDesc = description.toLowerCase();
        int urgencyScore = 0;
        List<String> matchedKeywords = new ArrayList<>();

        for (String keyword : URGENT_KEYWORDS) {
            if (lowerDesc.contains(keyword)) {
                urgencyScore += 3;
                matchedKeywords.add(keyword);
            }
        }

        for (String keyword : HIGH_PRIORITY_KEYWORDS) {
            if (lowerDesc.contains(keyword)) {
                urgencyScore += 2;
                matchedKeywords.add(keyword);
            }
        }

        for (String keyword : LOW_PRIORITY_KEYWORDS) {
            if (lowerDesc.contains(keyword)) {
                urgencyScore -= 1;
                matchedKeywords.add(keyword);
            }
        }

        if (description.length() > 200) {
            urgencyScore += 1;
        }

        long exclamationCount = description.chars().filter(ch -> ch == '!').count();
        if (exclamationCount >= 2) {
            urgencyScore += exclamationCount;
        }

        String suggestedPriority;
        if (urgencyScore >= 5) {
            suggestedPriority = "High";
        } else if (urgencyScore >= 2) {
            suggestedPriority = "Medium";
        } else {
            suggestedPriority = "Low";
        }

// Convert matches array to JSON string with quotes
String matchesJson = matchedKeywords.stream()
    .map(s -> "\"" + s + "\"")
    .collect(Collectors.joining(",", "[", "]"));

return String.format("{\"priority\":\"%s\",\"score\":%d,\"matches\":%s}",
    suggestedPriority,
    urgencyScore,
    matchesJson
);
    }
}