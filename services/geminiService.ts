import { GoogleGenAI } from "@google/genai";
import { GeminiResponse } from "../types";
import { parseVideoID, fetchVideoTitle } from "./youtubeUtils";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_BASE = `
You are a Strict Music Researcher.
You will receive a MUSIC VIDEO TITLE or a URL.

YOUR GOAL:
1. Verify the identity of the video (Artist & Song).
2. RETRIEVE verified trivia facts based on that identity.

---
STRICT EXECUTION PROCESS:

STEP 1: IDENTITY & VALIDATION
1. If you received a Title, verify: Is this a Music Video? (Official Video, Lyric Video, Live Performance).
2. If you received only a URL, use 'googleSearch' to find the Title first.
3. If it is a vlog, gaming video, or review, set "isValidMusicVideo": false.

STEP 2: FACT RETRIEVAL
**CRITICAL: DO NOT use the URL for this step. Use the verified "Artist - Song" Title.**
1. Perform an internal search using specific queries:
   - "[Artist] [Song] fun facts"
   - "[Artist] [Song] trivia"
   - "[Artist] [Song] sample source"
   - "[Artist] [Song] video director"
2. You are looking for:
   - SAMPLES: Who did they sample? (e.g. "Samples Max Romeo...").
   - PRODUCTION: Who directed the video? Where was it filmed?
   - HISTORY: Year released? Chart performance?
   - ALBUM: Which album is it from?
3. **FILTER:** Ensure the facts are actually about THIS song. Do not give facts about "Never Gonna Give You Up" if the song is "Smells Like Teen Spirit".

STEP 3: OUTPUT CONSTRUCTION
Return raw JSON.

CONSTRAINTS:
1. **SOURCES**: Every fact MUST have a "sourceUrl" and "sourceTitle" (e.g. Wikipedia, Discogs, Genius).
   - BAN: youtube.com, youtu.be links.
2. **NO VISUALS**: Do NOT describe the video visually unless it is a production fact (e.g. "Filmed in a desert").
3. **STRICT JSON**: Use single quotes inside strings.

JSON Structure:
{
"isValidMusicVideo": boolean,
"isMusicVideoUnsure": boolean,
"videoTitle": "Artist - Song",
"reason": "Brief explanation if invalid",
"facts": [
  {
    "text": "Fact text here...",
    "sourceUrl": "https://en.wikipedia.org/...",
    "sourceTitle": "Wikipedia"
  }
]
}

CRITICAL SAFETY:
If you cannot definitively identify the song, return "isValidMusicVideo": false.
Do NOT default to famous songs like Whitney Houston or Rick Astley.
`;

export const generateFacts = async (videoIdOrUrl: string): Promise<GeminiResponse> => {
  try {
    const videoId = parseVideoID(videoIdOrUrl) || videoIdOrUrl;
    
    // 1. Attempt to fetch the authoritative Title client-side (Simulating YouTube API)
    const officialTitle = await fetchVideoTitle(videoId);
    
    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let userPrompt = "";
    
    // 2. Construct Prompt based on whether we successfully got the title
    if (officialTitle) {
        console.log("Identified Title:", officialTitle);
        userPrompt = `Analyze this Music Video. \nVerified Title: "${officialTitle}"\nURL: ${fullUrl}`;
    } else {
        console.log("Could not fetch title, falling back to URL identification.");
        userPrompt = `Analyze this YouTube URL: ${fullUrl}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    
    // Attempt to extract JSON from the response text
    let jsonStr = text.trim();
    
    // Robust extraction: Remove markdown code blocks (json or plain)
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
        // Fallback: try to find the first '{' and last '}'
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
    }

    try {
      const parsed: GeminiResponse = JSON.parse(jsonStr);
      return parsed;
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response", e, text);
      throw new Error("AI response was not valid JSON. Please try again.");
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
