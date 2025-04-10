import fetch from "node-fetch";
import { config } from "dotenv";

config();

const apiKey = process.env.OPENAI_API_KEY;

export default async function genererLivre(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi de l’historique complet au backend…");

  const reponses = historique.filter(msg => msg.role === 'user').map(msg => msg.content.trim());
  console.log("🧩 Nombre total de réponses utilisateur :", reponses.length);

  const groupes = [];
  for (let i = 0; i < reponses.length; i += 3) {
    groupes.push(reponses.slice(i, i + 3).join("\n\n"));
  }

  console.log("✂️ Séquences à traiter :", groupes.length);

  const promptSysteme = "Tu es un biographe professionnel, littéraire et humain.";
  const promptUserBase = `Voici une partie d’interview biographique.

Ta mission :
- Rédige un passage narratif fluide, structuré, chronologique et humain à partir du contenu fourni.
- Structure le texte avec des **titres de chapitres** (niveau markdown : ## Chapitre X : Titre).
- N’invente rien. Utilise uniquement les éléments fournis.

Contenu :
`;

  const morceaux = [];

  for (let i = 0; i < groupes.length; i++) {
    const bloc = groupes[i];
    try {
      console.log(`📤 Envoi séquence ${i + 1} / ${groupes.length}...`);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 1.2,
          messages: [
            { role: "system", content: promptSysteme },
            { role: "user", content: promptUserBase + bloc }
          ]
        })
      });

      const data = await response.json();
      const texte = data?.choices?.[0]?.message?.content;
      if (texte) {
        morceaux.push(texte.trim());
        console.log("✅ Bloc généré avec succès");
      } else {
        console.warn("⚠️ Aucun texte généré pour ce bloc.");
      }
    } catch (err) {
      console.error("❌ Erreur pendant la génération d’un bloc :", err);
    }
  }

  const texteFinal = morceaux.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
  }

  // EXTRACTION DU PLAN depuis les titres de chapitre (markdown)
  const lignes = texteFinal.split("\n");
  const plan = lignes
    .filter(l => l.trim().startsWith("## "))
    .map((l, idx) => `- ${l.replace("##", "").trim()}`)
    .join("\n");

  console.log("📘 Texte final généré avec succès.");
  console.log("📋 Plan extrait :", plan || "Aucun titre détecté");

  res.status(200).json({
    texte: texteFinal,
    plan: plan || null,
  });
}
