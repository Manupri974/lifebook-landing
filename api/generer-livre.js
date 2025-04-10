// api/generer-livre.js – Génération du livre final (PDF)

import fetch from "node-fetch";
import { config } from "dotenv";
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

  // 1. Récupérer le dernier plan (markdown)
  const dernierPlanMsg = [...historique].reverse().find(
    (msg) => msg.role === "assistant" && msg.content.startsWith("## Chapitre")
  );

  if (!dernierPlanMsg) {
    return res.status(400).json({ message: "Aucun plan trouvé dans l'historique." });
  }

  const planMarkdown = dernierPlanMsg.content.trim();

  // 2. Extraire les réponses utilisateur précédant le plan
  const indexDernierPlan = historique.findIndex((msg) => msg === dernierPlanMsg);
  const reponsesUtilisateur = historique
    .slice(0, indexDernierPlan)
    .filter((msg) => msg.role === "user")
    .map((msg) => `- ${msg.content.trim()}`)
    .join("\n\n");

  // 3. Prompt de synthèse
  const prompt = `Voici un plan structuré pour une biographie :

${planMarkdown}

Voici les réponses de la personne :

${reponsesUtilisateur}

Rédige un texte biographique vivant et fluide, structuré selon le plan. Utilise uniquement les réponses fournies, sans rien inventer.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 1,
        messages: [
          {
            role: "system",
            content: "Tu es une biographe expérimentée et rigoureuse."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    const texte = data?.choices?.[0]?.message?.content;

    if (!texte || texte.length < 100) {
      return res.status(500).json({ message: "Texte trop court ou vide." });
    }

    return res.status(200).json({ texte: texte.trim(), plan: planMarkdown });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de la génération", error: err.message });
  }
}
