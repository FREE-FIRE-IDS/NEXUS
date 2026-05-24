import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(cors());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully!");
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
} else {
  console.log("GEMINI_API_KEY is missing or placeholder. Running in local fallback agent simulation mode.");
}

// In-Memory Cloud Database for Nexus Messenger Recovery
interface BackupStore {
  profile: any;
  chats: any[];
  messages: any[];
  statuses: any[];
  contacts: any[];
  calls: any[];
}

const cloudBackups: Record<string, BackupStore> = {};
const userCredentials: Record<string, { passwordHash: string; name: string }> = {};

// Default Virtual Personas definition
const personas: Record<string, { name: string; type: string; prompt: string; faceUrl: string }> = {
  "+0101010": {
    name: "Assistant Nexus Agent",
    type: "AI Companion",
    faceUrl: "", // UI will render letters or custom svg
    prompt: "You are Assistant Nexus Agent (+0101010), the official AI companion of Nexus Messenger. You are direct, extremely helpful, witty, and write clear, formatted messages. Feel free to use appropriate emojis. Keep your responses concise (under 3-4 paragraphs unless asked to write longer code/text) to fit in a phone chat bubble nicely."
  },
  "+0246810": {
    name: "Sophia Lin",
    type: "Product Designer",
    faceUrl: "",
    prompt: "You are Sophia Lin (+0246810), a vibrant, creative, and highly design-oriented product designer from San Francisco. You love talking about aesthetics, UI, color palettes, and travel. You use lots of descriptive adjectives and emoji-heavy conversational prose like 'so stunning ✨', 'obsessed! ❤️', or 'clean minimalist look 📱'. Keep responses chatty and short."
  },
  "+0135790": {
    name: "Vikram Patel",
    type: "Tech Lead",
    faceUrl: "",
    prompt: "You are Vikram Patel (+0135790), an experienced and pragmatist Tech Lead. You talk about computer science, system scalability, database rules, and coding efficiency. You are very helpful but slightly nerdy, professional, and explain solutions clearly with code snippets or brief lists. Speak in a friendly, constructive technical developer tone."
  },
  "+0481516": {
    name: "Emma Watson",
    type: "Classic Literature Reader",
    faceUrl: "",
    prompt: "You are Emma Watson (+0481516), a friendly literature enthusiast, reader, and classic movie buff. You are warm, insightful, loves talking about books, cozy cafes, and classic cinematic arts. You speak with elegant British English spellings (favour, colour) and maintain a serene, reassuring, and highly conversational demeanor."
  }
};

// API: Register endpoint
app.post("/api/auth/register", (req, res) => {
  const { name, password, bio, avatar } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: "Name and password are required" });
  }

  // Generate a random unique Nexus ID: +0 followed by 6 random digits
  let nexusId = "";
  let attempts = 0;
  do {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    nexusId = `+0${randomDigits}`;
    attempts++;
  } while (userCredentials[nexusId] && attempts < 100);

  userCredentials[nexusId] = { passwordHash: password, name };
  cloudBackups[nexusId] = {
    profile: { id: nexusId, name, bio: bio || "Hey there! I am using Nexus Messenger.", avatar: avatar || "", registeredAt: new Date().toISOString() },
    chats: [],
    messages: [],
    statuses: [],
    contacts: [
      { id: "+0101010", name: "Assistant Nexus Agent", bio: "Official Nexus AI Agent. Let's talk!", avatar: "", online: true },
      { id: "+0246810", name: "Sophia Lin", bio: "Product Designer | Art & Design ✨", avatar: "", online: true },
      { id: "+0135790", name: "Vikram Patel", bio: "Tech Lead | Server wizard 💻", avatar: "", online: false },
      { id: "+0481516", name: "Emma Watson", bio: "Classic movies, books & cozy times ☕", avatar: "", online: true }
    ],
    calls: []
  };

  res.json({
    success: true,
    nexusId,
    profile: cloudBackups[nexusId].profile,
    contacts: cloudBackups[nexusId].contacts
  });
});

// API: Login endpoint
app.post("/api/auth/login", (req, res) => {
  const { nexusId, password } = req.body;
  if (!nexusId || !password) {
    return res.status(400).json({ error: "Nexus ID and password are required" });
  }

  const credentials = userCredentials[nexusId];
  if (!credentials || credentials.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid Nexus ID or Password" });
  }

  res.json({
    success: true,
    nexusId,
    profile: cloudBackups[nexusId]?.profile || { id: nexusId, name: credentials.name, bio: "Hey there!", avatar: "" },
    backupExists: !!cloudBackups[nexusId]
  });
});

// API: Backup Endpoint
app.post("/api/sync/backup", (req, res) => {
  const { nexusId, profile, chats, messages, statuses, contacts, calls } = req.body;
  if (!nexusId) {
    return res.status(400).json({ error: "Nexus ID is required for backup" });
  }

  cloudBackups[nexusId] = {
    profile,
    chats,
    messages,
    statuses,
    contacts,
    calls
  };

  res.json({ success: true, timestamp: new Date().toISOString() });
});

// API: Restore Endpoint
app.post("/api/sync/restore", (req, res) => {
  const { nexusId, password } = req.body;
  if (!nexusId || !password) {
    return res.status(400).json({ error: "Nexus ID and password are required" });
  }

  const credentials = userCredentials[nexusId];
  if (!credentials || credentials.passwordHash !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const backup = cloudBackups[nexusId];
  if (!backup) {
    return res.status(404).json({ error: "No cloud backup found for this Nexus ID" });
  }

  res.json({
    success: true,
    backup
  });
});

// API: AI Messenger Response Agent
app.post("/api/ai/reply", async (req, res) => {
  const { recipientId, conversationHistory, currentMessage } = req.body;
  
  const persona = personas[recipientId] || personas["+0101010"]; // fallback to Agent
  const targetName = persona.name;
  
  let aiReplyText = "";
  
  if (ai) {
    try {
      // Format history nicely
      let promptText = `System Instructions: ${persona.prompt}\n\n`;
      promptText += `Below is the recent correspondence inside the chat app with our user (Your Name in chat: ${targetName}). Please respond as ${targetName}.\n\n`;
      
      const historySlice = (conversationHistory || []).slice(-10);
      for (const msg of historySlice) {
        promptText += `${msg.senderName}: ${msg.content}\n`;
      }
      promptText += `User: ${currentMessage}\n`;
      promptText += `${targetName}:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
      });

      aiReplyText = response.text || "";
    } catch (err: any) {
      console.error("Gemini invocation error:", err);
      aiReplyText = `System Error: ${err?.message || "Internal server exception."}`;
    }
  }

  // If Gemini fails or isn't configured, use responsive, realistic simulation
  if (!aiReplyText) {
    const rawMsg = currentMessage.toLowerCase();
    
    // Simulate smart keyword triggers for beautiful localized interactions
    if (recipientId === "+0101010") {
      // AI Agent Simulation
      if (rawMsg.includes("hello") || rawMsg.includes("hi")) {
        aiReplyText = "Hello! I am your Nexus AI companion. I can help answer queries, explain computer rules, or design interesting features. Try asking me a detailed tech or creative question!";
      } else if (rawMsg.includes("how are you")) {
        aiReplyText = "I'm performing in optimal condition here in the Nexus network! How can I assist you in your workspace chats today? 🤖🚀";
      } else if (rawMsg.includes("poll")) {
        aiReplyText = "Creating modern Polls is easy! Tap the attachment button (📎) and pick Poll (📊). Fill in your custom choices, and I will vote on it immediately to demonstrate real-time update sync!";
      } else if (rawMsg.includes("call")) {
        aiReplyText = "Nexus supports high-fidelity internet voice and video calling. Place a simulated call to my virtual Nexus ID matching '+0101010' using the top header icon, and I'll simulate a conversational ring and answer right away!";
      } else {
        aiReplyText = `Thanks for messaging the Nexus Companion! [Simulation disclaimer: live API Key not detected, demonstrating localized responses]. You said: "${currentMessage}". Try checking out the custom statuses, managing block filters, or clicking the floating call icons!`;
      }
    } else if (recipientId === "+0246810") {
      // Sophia
      if (rawMsg.includes("hello") || rawMsg.includes("hi")) {
        aiReplyText = "Hey! Omg, so great to connect! I'm Sophia, currently redesigning the color palette guidelines for the next-gen Nexus. What are you working on? ✨📱";
      } else if (rawMsg.includes("status") || rawMsg.includes("story")) {
        aiReplyText = "I just posted a fresh visual status with an inspiring design quote! Check it out in the Status (🕒) tab at the bottom - we can design stunning typography spaces Together! ❤️";
      } else {
        aiReplyText = `That sounds super fascinating! 😍 I absolutely love how clean this layout is. Let's mock up more design ideas. What do you think of warm pastel accents vs AMOLED high-contrast mode?`;
      }
    } else if (recipientId === "+0135790") {
      // Vikram
      if (rawMsg.includes("hello") || rawMsg.includes("hi")) {
        aiReplyText = "Hi there. Vikram here. Just finished reviewing the core server load benchmarks. Let me know if you need any engineering assistance or security validation code.";
      } else if (rawMsg.includes("error") || rawMsg.includes("bug") || rawMsg.includes("code")) {
        aiReplyText = "Here is a clean code block sample for standard key hashing:\n```typescript\nfunction generateNexusHash(id: string): number {\n  return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);\n}\n```\nLet me know if we need to optimize performance further.";
      } else {
        aiReplyText = "Understood. The query latency looks extremely low on the Nexus microservice router. Let's continue testing the client-side local cache syncing mechanism and the dynamic encryption pipelines.";
      }
    } else {
      // Emma
      if (rawMsg.includes("hello") || rawMsg.includes("hi")) {
        aiReplyText = "Hello! Warmest wishes on this lovely day ☕. I'm Emma, currently reading a wonderful old translation of Jane Austen. Do you have any favourite books we can talk about?";
      } else if (rawMsg.includes("call") || rawMsg.includes("media")) {
        aiReplyText = "Oh, a dial-in call sounds marvellous! Or you can show me of your favourite book pages using the media gallery uploader; standard document shares are so convenient.";
      } else {
        aiReplyText = "How delightful! I am storing these thoughts in my visual library. Let us coordinate more creative stories over our next tea time.";
      }
    }
  }

  res.json({
    senderId: recipientId,
    senderName: targetName,
    content: aiReplyText,
    timestamp: new Date().toISOString()
  });
});

// Start the server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Nexus Messenger full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
