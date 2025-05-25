// pages/api/conversation.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY!;

interface ConversationRequest {
  agent_id: string;
  audio?: string; // Base64 encoded audio
  text?: string;
  voice_settings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  model_id?: string;
  agent_prompt?: string;
  first_message?: string;
  language?: string;
}

interface ElevenLabsConversationConfig {
  agent_id: string;
  audio?: string;
  text?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
  model_id?: string;
  conversation_config?: {
    agent_prompt?: string;
    first_message?: string;
    language?: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    agent_id = "your_agent_id", // Remplacez par votre ID d'agent ElevenLabs
    audio,
    text,
    voice_settings = {
      stability: 0.5,
      similarity_boost: 0.7,
      style: 0.0,
      use_speaker_boost: true
    },
    model_id = "eleven_multilingual_v2",
    agent_prompt = "You are a medical AI assistant specialized in appointment booking and health data analysis. Use the Mistral AI tool for medical queries. Be empathetic and professional.",
    first_message = "Hello! How can I help you today?",
    language = "en"
  }: ConversationRequest = req.body;

  // Validation
  if (!audio && !text) {
    return res.status(400).json({ 
      error: "Either 'audio' or 'text' is required" 
    });
  }

  if (!agent_id || agent_id === "your_agent_id") {
    return res.status(400).json({ 
      error: "Please configure your agent_id in the code or send it in the request" 
    });
  }

  try {
    // Configuration pour l'API Conversational AI d'ElevenLabs
    const conversationConfig: ElevenLabsConversationConfig = {
      agent_id,
      voice_settings,
      model_id,
      conversation_config: {
        agent_prompt,
        first_message,
        language
      }
    };

    // Ajouter audio ou texte selon ce qui est fourni
    if (audio) {
      conversationConfig.audio = audio;
    } else if (text) {
      conversationConfig.text = text;
    }

    console.log("Sending request to ElevenLabs Conversational AI...");

    // Appel à l'API Conversational AI d'ElevenLabs
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/convai/conversation",
      conversationConfig,
      {
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer" // Pour récupérer l'audio en binaire
      }
    );

    console.log("Response received from ElevenLabs");

    // Vérifier le type de contenu de la réponse
    const contentType = response.headers["content-type"];
    
    if (contentType && contentType.includes("audio")) {
      // Si la réponse est de l'audio, la renvoyer directement
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(response.data);
    } else {
      // Si c'est du JSON, le parser et le renvoyer
      const jsonResponse = JSON.parse(response.data.toString());
      res.status(200).json(jsonResponse);
    }

  } catch (err: any) {
    console.error("ElevenLabs API Error:", err.response?.data || err.message);
    
    // Gestion d'erreur plus détaillée
    if (err.response) {
      const statusCode = err.response.status;
      const errorData = err.response.data;
      
      if (statusCode === 401) {
        return res.status(401).json({ 
          error: "Invalid API key" 
        });
      } else if (statusCode === 400) {
        return res.status(400).json({ 
          error: "Bad request", 
          details: errorData 
        });
      } else if (statusCode === 404) {
        return res.status(404).json({ 
          error: "Agent not found. Please check your agent_id" 
        });
      }
    }
    
    res.status(500).json({ 
      error: "Something went wrong", 
      details: err.message 
    });
  }
}

// Types pour export (optionnel)
export type { ConversationRequest };