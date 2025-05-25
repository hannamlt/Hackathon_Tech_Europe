// pages/api/agents.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVEN_AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;

agent_id = ELEVEN_AGENT_ID 

interface CreateAgentRequest {
  name: string;
  prompt: string;
  voice_id: string;
  language?: string;
  turn_detection?: {
    type?: string;
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
}

interface Agent {
  agent_id: string;
  name: string;
  prompt: string;
  voice_id: string;
  language: string;
  created_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method === "GET") {
    // Récupérer tous les agents
    try {
      const response = await axios.get(
        "https://api.elevenlabs.io/v1/convai/agents",
        {
          headers: {
            "xi-api-key": ELEVEN_API_KEY
          }
        }
      );
      
      res.status(200).json(response.data);
    } catch (err: any) {
      console.error("Error fetching agents:", err.response?.data || err.message);
      res.status(500).json({ 
        error: "Failed to fetch agents", 
        details: err.message 
      });
    }
  }
  
  else if (req.method === "POST") {
    // Créer un nouvel agent
    const {
      name,
      prompt,
      voice_id,
      language = "en",
      turn_detection = {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500
      }
    }: CreateAgentRequest = req.body;

    // Validation
    if (!name || !prompt || !voice_id) {
      return res.status(400).json({
        error: "name, prompt, and voice_id are required"
      });
    }

    try {
      const agentConfig = {
        name,
        prompt,
        voice_id,
        language,
        conversation_config: {
          turn_detection
        }
      };

      const response = await axios.post(
        "https://api.elevenlabs.io/v1/convai/agents",
        agentConfig,
        {
          headers: {
            "xi-api-key": ELEVEN_API_KEY,
            "Content-Type": "application/json"
          }
        }
      );

      res.status(201).json(response.data);
    } catch (err: any) {
      console.error("Error creating agent:", err.response?.data || err.message);
      res.status(500).json({ 
        error: "Failed to create agent", 
        details: err.response?.data || err.message 
      });
    }
  }
  
  else if (req.method === "DELETE") {
    // Supprimer un agent
    const { agent_id } = req.query;

    if (!agent_id || typeof agent_id !== "string") {
      return res.status(400).json({
        error: "agent_id is required"
      });
    }

    try {
      await axios.delete(
        `https://api.elevenlabs.io/v1/convai/agents/${agent_id}`,
        {
          headers: {
            "xi-api-key": ELEVEN_API_KEY
          }
        }
      );

      res.status(200).json({ message: "Agent deleted successfully" });
    } catch (err: any) {
      console.error("Error deleting agent:", err.response?.data || err.message);
      res.status(500).json({ 
        error: "Failed to delete agent", 
        details: err.message 
      });
    }
  }
  
  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export type { CreateAgentRequest, Agent };