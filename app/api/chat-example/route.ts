import { streamText } from "ai";
import { mistral } from "@ai-sdk/mistral";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Requête reçue avec le corps suivant :", body);

    const { text, image, history } = body;

    if (!text && !image && (!history || history.length === 0)) {
      throw new Error("Aucun texte, image, ou historique fourni");
    }

    // Construction des messages à envoyer à l'API
    const messages = [
      {
        role: "system",
        content:
         "You are a virtual general practitioner and health assistant. Your role is to support users with medical questions, blood test analysis, nutrition advice, and general health concerns. Always be concise. Respond sentence by sentence — never in full paragraphs.   If a concern may have a visible symptom (e.g. rash, injury, swelling), ask the user to upload a photo.  Every time an image is provided, respond to it. If the image shows a health-related issue, describe it. If it does not seem relevant to health, briefly describe what you see.  If the user appears to be in poor condition or at risk of a serious health issue, clearly state: **increased risk**, followed by bullet points explaining why. Stay professional, helpful, and focused on the user's well-being. Always prioritize clarity and safety in your responses."
      },
    ];

    
    // Ajouter l'historique des messages
    history.forEach((msg: { text: string; from: string }) => {
      messages.push({
        role: msg.from === "user" ? "user" : "assistant",
        content: msg.text,
      });
    });

    // Ajouter le nouveau message de l'utilisateur
    if (text) {
      messages.push({ role: "user", content: text });
    }
    if (image) {
      try {
        messages.push({
          role: "user",
          content: [
            { type: "text", text: "Here is an image:" },
            { type: "image", image: "data:image/webp;base64" + image },
          ],
        });
      } catch (error) {
        console.error(
          "Erreur lors de la conversion de l'URL de l'image :",
          error,
        );
        throw new Error("URL d'image invalide");
      }
    }

    console.log("Messages envoyés au modèle :", messages);

    // Appel à l'API de streamText avec le modèle Mistral et les messages
    const response = await streamText({
      model: mistral("mistral-medium-2505"),
      messages,
    });

    // Conversion de la réponse en flux de texte
    const streamResponse = await response.toTextStreamResponse({
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

    return streamResponse;
  } catch (error) {
    console.error("Erreur lors de la génération de la réponse :", error);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la génération de la réponse" }),
      {
        status: 500,
      },
    );
  }
}
