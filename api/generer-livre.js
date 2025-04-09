export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi de l’historique complet à OpenAI...");

  const reponsesUtilisateur = historique
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.trim())
    .join("\n\n");

  const promptSysteme = `
Tu es un biographe professionnel.
Ton style est littéraire, fluide, chaleureux, mais toujours clair et humain.
Tu sais transformer des souvenirs bruts en récits vivants et touchants.
`;

  const promptUser = `
Voici l’ensemble des réponses d’une interview biographique.

Ta mission :
- Écris un récit narratif structuré et fluide à partir des réponses.
- Donne du rythme et de la profondeur au texte.
- Ne reformule pas les questions.
- N’invente rien.
- Intègre tous les éléments concrets : lieux, dates, objets, anecdotes, émotions.
- Donne une unité stylistique à l’ensemble, comme un vrai chapitre de livre.

Réponses :
${reponsesUtilisateur}
`;

  console.log("📤 Prompt envoyé à l’API :\n", promptUser);

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
          { role: "user", content: promptUser }
        ]
      })
    });

    const data = await response.json();
    const texteFinal = data?.choices?.[0]?.message?.content?.trim();

    if (!texteFinal || texteFinal.length < 100) {
      console.warn("⚠️ Texte trop court :", texteFinal);
      return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
    }

    console.log("✅ Texte généré avec succès.");
    res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
