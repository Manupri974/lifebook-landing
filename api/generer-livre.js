export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi à OpenAI - Nombre de réponses :", historique.length);

  const promptSysteme = "Tu es un biographe professionnel. Ton style est littéraire, fluide et chaleureux.";

  const promptUser = `
Tu es chargé de rédiger un **récit de vie biographique** à partir de réponses à une interview.

🎯 Objectif : Écrire un **texte structuré, romancé, divisé en chapitres**.

🎨 Style :
- Littéraire mais accessible, avec une narration vivante.
- Aucun retour à la ligne ou liste brute : uniquement du texte fluide.
- Évite le tutoiement ou vouvoiement. Ne t’adresse pas à la personne directement.

📚 Structure :
- Organise le récit en **chapitres clairs, d'une page minmum**, avec des titres pertinents.
- Développe chaque souvenir ou anecdote.
- Si une réponse est courte, utilise-la comme point de départ pour un développement émotionnel ou descriptif.

💬 Matière à exploiter :
${historique
    .filter(m => m.role === 'user')
    .map(m => m.content.trim())
    .join("\n\n")}
  `;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 1.3,
        messages: [
          { role: "system", content: promptSysteme },
          { role: "user", content: promptUser }
        ]
      })
    });

    const data = await response.json();
    const texteFinal = data?.choices?.[0]?.message?.content?.trim();

    if (!texteFinal || texteFinal.length < 100) {
      console.warn("⚠️ Texte généré trop court ou vide.");
      return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
    }

    console.log("✅ Texte généré avec succès. Longueur :", texteFinal.length);
    res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
