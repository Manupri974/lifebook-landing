import { config } from "dotenv";
import fetch from "node-fetch";

config();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi de l’historique complet au backend…");

  // Étape 1 : Extraire uniquement les réponses utilisateur
  const reponses = historique.filter(msg => msg.role === 'user').map(msg => msg.content.trim());

  // Étape 2 : Découpage par blocs de 3 réponses
  const groupes = [];
  for (let i = 0; i < reponses.length; i += 3) {
    groupes.push(reponses.slice(i, i + 3).join("\n\n"));
  }

  // Étape 3 : Prompts
  const promptSysteme = "Tu es un biographe professionnel, littéraire et humain.";
  const promptUserBase = `Voici une partie d’interview biographique.

Ta mission :
- Rédige un passage narratif fluide, chronologique et chaleureux à partir du contenu fourni.
- Utilise un style littéraire simple mais expressif, humain, sans artifices.
- Ne reformule pas les questions. N’invente rien. Utilise uniquement les éléments ci-dessous.

Contenu :
`;

  const morceaux = [];

  for (const bloc of groupes) {
    try {
      console.log("📤 Envoi d’un bloc de 3 réponses...");
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

  console.log("📘 Texte final généré avec succès. Longueur :", texteFinal.length);
  res.status(200).json({ texte: texteFinal });
}
