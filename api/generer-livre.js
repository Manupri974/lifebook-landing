import fetch from "node-fetch";
import { config } from "dotenv";

config();
const apiKey = process.env.OPENAI_API_KEY;

export default async function genererLivre(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: "Clé API ou historique manquant/invalide" });
  }

  console.log("🚀 Génération du livre par séquences logiques...");

  // Étape 1 : Grouper les messages utilisateur par séquence
  const sequences = {};
  let currentSequence = "1";

  for (const msg of historique) {
    if (msg.role === "assistant" && msg.content.includes("### Séquence")) {
      const match = msg.content.match(/### Séquence\s*:\s*(\d+)/i);
      if (match) {
        currentSequence = match[1];
        continue;
      }
    }

    if (msg.role === "user") {
      if (!sequences[currentSequence]) sequences[currentSequence] = [];
      sequences[currentSequence].push(msg.content.trim());
    }
  }

  console.log("🧩 Séquences logiques détectées :", Object.keys(sequences).length);

  // Étape 2 : Générer un chapitre par séquence
  const promptSysteme = "Tu es un biographe littéraire, empathique, humain.";
  const promptChapitre = (bloc) => `Voici une séquence d’interview biographique :

${bloc}

Ta mission :
- Génère un **chapitre fluide et narratif** à partir de ces éléments.
- Commence par un **titre stylisé** (niveau titre principal).
- Puis rédige un texte fluide, littéraire, chaleureux et réaliste à la première ou troisième personne.
- Utilise seulement les faits présents (pas d’invention).
`;

  const chapitres = [];

  for (const numero in sequences) {
    const bloc = sequences[numero].join("\n\n");
    try {
      console.log(`📤 Traitement séquence ${numero}...`);
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
            { role: "user", content: promptChapitre(bloc) }
          ]
        })
      });

      const data = await response.json();
      const texte = data?.choices?.[0]?.message?.content;
      if (texte) {
        chapitres.push(texte.trim());
        console.log(`✅ Chapitre ${numero} généré`);
      } else {
        console.warn(`⚠️ Aucun texte généré pour la séquence ${numero}`);
      }
    } catch (err) {
      console.error(`❌ Erreur sur la séquence ${numero} :`, err);
    }
  }

  const texteFinal = chapitres.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
  }

  console.log("📘 Livre final généré avec succès.");
  res.status(200).json({ texte: texteFinal });
}
