import { config } from "dotenv";
import fetch from "node-fetch";

config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: "Clé API ou historique manquant/invalide" });
  }

  const reponsesUtilisateur = historique.filter(m => m.role === "user").map(m => m.content.trim());
  console.log("🧩 Envoi à OpenAI - Nombre de réponses :", reponsesUtilisateur.length);

  try {
    const paragraphes = [];

    for (let i = 0; i < reponsesUtilisateur.length; i++) {
      const prompt = `Voici une réponse donnée par une personne dans le cadre d'une interview biographique :\n"""\n${reponsesUtilisateur[i]}\n"""\n\nGénère un paragraphe littéraire, romancé et expressif autour de cette réponse. Utilise un style fluide, humain et chaleureux. Ne répète pas la réponse telle quelle, développe, brode autour. N'invente rien, mais enrichis subtilement. Ne donne pas de titre, juste un paragraphe.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 1.1,
          messages: [
            { role: "system", content: "Tu es un écrivain professionnel de biographies humaines et littéraires." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      const generated = data?.choices?.[0]?.message?.content?.trim();
      if (generated && generated.length > 50) {
        paragraphes.push(generated);
      } else {
        console.warn(`⚠️ Réponse ignorée pour l'entrée ${i + 1}`);
      }
    }

    const texteFinal = paragraphes.join("\n\n");
    console.log("✅ Texte généré avec succès. Longueur :", texteFinal.length);
    return res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    return res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
