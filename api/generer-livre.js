import fetch from "node-fetch";
import { config } from "dotenv";

config();
const apiKey = process.env.OPENAI_API_KEY;

export default async function genererLivre(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const { segments } = req.body;

  if (!apiKey || !segments || typeof segments !== "object") {
    return res.status(400).json({ message: "Clé API ou segments manquants/invalides" });
  }

  console.log("🚀 Génération du livre à partir des segments logiques...");
  console.log("🧩 Nombre de segments détectés :", Object.keys(segments).length);
  console.log("📦 Segments reçus :", segments);

  // Prompt base
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

  for (const numero in segments) {
    const bloc = segments[numero].join("\n\n");
    console.log(`📤 Envoi de la séquence ${numero} à l’API...`);
    console.log("📄 Contenu de la séquence :", bloc);

    try {
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
        console.log(`✅ Chapitre généré pour la séquence ${numero}`);
      } else {
        console.warn(`⚠️ Aucune réponse pour la séquence ${numero}`, data);
      }
    } catch (err) {
      console.error(`❌ Erreur API pour la séquence ${numero} :`, err);
    }
  }

  const texteFinal = chapitres.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
  }

  console.log("📘 Livre final généré avec succès.");
  res.status(200).json({ texte: texteFinal });
}
