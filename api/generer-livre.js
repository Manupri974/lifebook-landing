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
    return res.status(400).json({ message: "Clé API ou segments manquant/invalide" });
  }

  console.log("🚀 Génération du livre à partir des segments logiques...");
  console.log("📦 Segments reçus :", segments);

  const promptSysteme = "Tu es un biographe littéraire, empathique, humain.";
  const promptChapitre = (bloc, num) => `Voici une séquence d’interview biographique :

${bloc}

Ta mission :
- Génére un **chapitre fluide et narratif** à partir de ces éléments.
- Commence par un **titre stylisé** pour le chapitre ${num}, par exemple : "Chapitre ${num} — Le goût de l’enfance".
- Puis rédige un texte fluide, littéraire, chaleureux et réaliste à la première ou troisième personne.
- N’invente rien. Utilise uniquement les faits évoqués.
- Évite les répétitions. Le style doit rester simple et fluide.`;

  const chapitres = [];

  for (const numero in segments) {
    const bloc = segments[numero].join("\n\n");
    console.log(`📤 Envoi de la séquence ${numero} à l’API...`);
    console.log("📄 Contenu :", bloc);

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
            { role: "system", content: promptSysteme },
            { role: "user", content: promptChapitre(bloc, numero) }
          ]
        })
      });

      const data = await response.json();
      const texte = data?.choices?.[0]?.message?.content;

      if (texte) {
        chapitres.push(texte.trim());
        console.log(`✅ Chapitre ${numero} généré`);
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
