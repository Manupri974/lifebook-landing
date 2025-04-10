// api/plan.js – Génération d'un plan structuré à partir des réponses utilisateur

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

  const reponses = historique
    .filter(msg => msg.role === "user")
    .map(msg => msg.content.trim())
    .join("\n\n");

  const prompt = `Tu es une biographe expérimentée.
Voici les réponses fournies par une personne dans le cadre d'une interview biographique :

${reponses}

Ta mission :
- Propose un **plan de livre clair et structuré**, avec 5 à 8 chapitres maximum.
- Chaque chapitre doit avoir un **titre impactant** et une **description concise (2-3 lignes)**.
- Utilise des sauts de ligne pour séparer chaque chapitre, et du markdown pour le formatage.

Format attendu :
# Chapitre 1 : Titre inspirant
Description du chapitre...

# Chapitre 2 : Titre...
Description...

Termine en proposant à la personne de modifier, réorganiser ou enrichir ce plan avant génération du livre.`;

  try {
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
          { role: "system", content: "Tu es une assistante littéraire efficace." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const texte = data?.choices?.[0]?.message?.content;

    if (!texte || texte.length < 30) {
      return res.status(500).json({ message: "Texte trop court ou vide." });
    }

    // ✅ Correction ici : "texte" au lieu de "plan"
    return res.status(200).json({ texte: texte.trim() });
  } catch (err) {
    return res.status(500).json({
      message: "Erreur lors de la génération du plan",
      error: err.message
    });
  }
}
