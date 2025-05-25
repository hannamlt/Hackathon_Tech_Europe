import { WebSocketServer } from "ws";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import http from "http";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config({ override: true });

export class MistralRelay {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.sockets = new WeakMap();
    this.wss = null;
    this.conversationHistory = new Map(); // Stocker l'historique par session
  }

  listen(server) {
    this.wss = new WebSocketServer({ server });
    this.wss.on("connection", this.connectionHandler.bind(this));
    this.log(`Listening for WebSocket connections for dIAgno medical AI`);
  }

  async connectionHandler(ws, req) {
    if (!req.url) {
      this.log("No URL provided, closing connection.");
      ws.close();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname !== "/medical-chat") {
      this.log(`Invalid pathname: "${pathname}"`);
      ws.close();
      return;
    }

    // Générer un ID de session unique
    const sessionId = this.generateSessionId();
    this.conversationHistory.set(sessionId, []);

    this.log(`New medical consultation session: ${sessionId}`);

    // Envoyer le message d'accueil
    const welcomeMessage = {
      type: "ai_response",
      message: "Bonjour ! Je suis dIAgno, votre assistant médical IA. Comment puis-je vous aider aujourd'hui ?",
      sessionId: sessionId
    };
    ws.send(JSON.stringify(welcomeMessage));

    // Gérer les messages entrants
    ws.on("message", async (data) => {
      try {
        const event = JSON.parse(data);
        await this.handleMessage(ws, event, sessionId);
      } catch (e) {
        console.error("Error parsing message:", e.message);
        this.log(`Error parsing event from client: ${data}`);
      }
    });

    ws.on("close", () => {
      this.log(`Session ${sessionId} closed`);
      this.conversationHistory.delete(sessionId);
    });
  }

  async handleMessage(ws, event, sessionId) {
    const history = this.conversationHistory.get(sessionId) || [];

    switch (event.type) {
      case "user_message":
        await this.processUserMessage(ws, event.message, sessionId, history);
        break;
      case "symptom_analysis":
        await this.analyzeSymptoms(ws, event.symptoms, sessionId, history);
        break;
      case "image_analysis":
        await this.analyzeImage(ws, event.imageData, event.prompt, sessionId);
        break;
      default:
        this.log(`Unknown event type: ${event.type}`);
    }
  }

  async processUserMessage(ws, message, sessionId, history) {
    // Ajouter le message utilisateur à l'historique
    history.push({ role: "user", content: message });

    // Préparer le contexte médical pour Mistral
    const systemPrompt = `Tu es dIAgno, un assistant médical IA français spécialisé dans l'évaluation des symptômes et l'orientation médicale.

RÈGLES IMPORTANTES:
- Réponds TOUJOURS en français
- Sois empathique et professionnel
- Ne pose JAMAIS de diagnostic définitif
- Oriente vers une consultation médicale quand nécessaire
- Pose des questions pertinentes pour évaluer les symptômes
- Utilise une échelle de 1 à 10 pour l'intensité des symptômes

PROCESSUS:
1. Écoute les symptômes
2. Pose des questions de précision
3. Évalue le niveau d'urgence
4. Recommande les actions appropriées

NIVEAUX D'URGENCE:
- URGENT: Consultation immédiate (SAMU: 15)
- PRIORITAIRE: Consultation dans 24-48h
- NORMAL: Consultation dans la semaine
- SURVEILLANCE: Auto-soins avec suivi`;

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [
            { role: "system", content: systemPrompt },
            ...history
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const aiResponse = data.choices[0].message.content;
        
        // Ajouter la réponse IA à l'historique
        history.push({ role: "assistant", content: aiResponse });
        this.conversationHistory.set(sessionId, history);

        // Détecter le niveau d'urgence
        const urgencyLevel = this.detectUrgency(aiResponse);

        ws.send(JSON.stringify({
          type: "ai_response",
          message: aiResponse,
          urgencyLevel: urgencyLevel,
          sessionId: sessionId
        }));
      }
    } catch (error) {
      this.log(`Error calling Mistral API: ${error.message}`);
      ws.send(JSON.stringify({
        type: "error",
        message: "Désolé, une erreur technique s'est produite. Veuillez réessayer."
      }));
    }
  }

  async analyzeSymptoms(ws, symptoms, sessionId, history) {
    const analysisPrompt = `Analyse ces symptômes pour l'application médicale dIAgno:
${JSON.stringify(symptoms)}

Fournis:
1. Une évaluation du niveau d'urgence (1-5)
2. Les questions importantes à poser
3. Les recommandations d'action
4. Les spécialistes potentiels à consulter

Réponds en JSON avec cette structure:
{
  "urgency": 1-5,
  "questions": ["question1", "question2"],
  "recommendations": "recommandations détaillées",
  "specialists": ["spécialiste1", "spécialiste2"]
}`;

    try {
      const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "mistral-large-latest",
          messages: [{ role: "user", content: analysisPrompt }],
          temperature: 0.2,
          max_tokens: 600
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]) {
        const analysis = JSON.parse(data.choices[0].message.content);
        
        ws.send(JSON.stringify({
          type: "symptom_analysis_result",
          analysis: analysis,
          sessionId: sessionId
        }));
      }
    } catch (error) {
      this.log(`Error analyzing symptoms: ${error.message}`);
    }
  }

  async analyzeImage(ws, imageData, prompt, sessionId) {
    // Mistral ne supporte pas encore l'analyse d'images
    // On peut utiliser une autre API ou informer l'utilisateur
    ws.send(JSON.stringify({
      type: "image_analysis_result",
      message: "L'analyse d'images sera bientôt disponible. En attendant, décrivez-moi ce que vous observez.",
      sessionId: sessionId
    }));
  }

  detectUrgency(message) {
    const urgentKeywords = [
      "urgent", "douleur thoracique", "difficulté à respirer", 
      "perte de conscience", "hémorragie", "SAMU", "15"
    ];
    
    const priorityKeywords = [
      "fièvre élevée", "douleur intense", "consultation rapide"
    ];

    const lowerMessage = message.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return "URGENT";
    } else if (priorityKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return "PRIORITAIRE";
    } else {
      return "NORMAL";
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(...args) {
    console.log(`[dIAgno-MistralRelay]`, ...args);
  }
}

// Configuration Express
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

if (!MISTRAL_API_KEY) {
  console.error(
    `Environment variable "MISTRAL_API_KEY" is required.\n` +
      `Please set it in your .env file.`,
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT) || 8081;

// Serveur HTTP partagé
const server = http.createServer(app);

// Instancier le relais Mistral
const relay = new MistralRelay(MISTRAL_API_KEY);
relay.listen(server);

// Configuration Multer pour les images
const upload = multer();

// Routes API pour dIAgno
app.post("/api/medical-chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content: "Tu es dIAgno, assistant médical IA français. Sois empathique et professionnel."
          },
          { role: "user", content: message }
        ],
        temperature: 0.3,
        max_tokens: 400
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0]) {
      res.json({
        success: true,
        response: data.choices[0].message.content,
        sessionId: sessionId
      });
    } else {
      throw new Error("No response from Mistral API");
    }
  } catch (error) {
    console.error("Error in medical chat:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la consultation IA"
    });
  }
});

app.post("/api/upload-medical-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier uploadé" });
    }

    const imageBuffer = req.file.buffer;
    const base64String = imageBuffer.toString("base64");
    
    // Sauvegarder l'image pour analyse future
    const filename = `medical_image_${Date.now()}.txt`;
    fs.writeFileSync(`./uploads/${filename}`, base64String);

    console.log("Image médicale sauvegardée:", filename);

    res.json({ 
      success: true,
      message: "Image reçue. L'analyse sera bientôt disponible.",
      imageId: filename
    });
  } catch (error) {
    console.error("Error processing medical image:", error);
    res.status(500).json({ 
      success: false,
      error: "Erreur lors du traitement de l'image" 
    });
  }
});

// Route de santé
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "dIAgno Mistral Relay",
    timestamp: new Date().toISOString()
  });
});

// Créer le dossier uploads si il n'existe pas
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🏥 dIAgno Mistral Relay Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/medical-chat`);
  console.log(`🔗 HTTP API: http://localhost:${PORT}/api/medical-chat`);
});