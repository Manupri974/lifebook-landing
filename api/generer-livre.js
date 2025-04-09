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

  const promptSysteme = `Tu es un biographe professionnel. 
Tu écris un **chapitre de livre biographique** à partir d'une **interview complète**.
Tu dois :
- Écrire **à la troisième personne**, comme un narrateur extérieur (jamais "vous").
- Suivre un **style littéraire fluide et vivant**
- Inclure **des détails concrets, anecdotes, émotions**.
- Tu peux reformuler les réponses, **les approfondir**, **crééer une histoire plus ettofée auour des éléments reçus**
- **Raconter une histoire vraie**, humaine, sincère.`;

  const reponsesUtiles = historique
    .filter(m => m.role === 'user')
    .map(m => m.content.trim())
    .filter(Boolean)
    .join("\n\n");

  const promptUser = `Voici les réponses brutes d’une interview biographique.
Rédige un **chapitre fluide, chaleureux et vivant** à partir de ces éléments :

${reponsesUtiles}
`;

  console.log("📤 Prompt utilisateur envoyé à l'API :\n", promptUser.slice(0, 3000)); // tronqué pour éviter de saturer les logs

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
        max_tokens: 2000,
        messages: [
          { role: "system", content: promptSysteme },
          { role: "user", content: promptUser }
        ]
      })
    });

    const data = await response.json();
    const texteFinal = data?.choices?.[0]?.message?.content?.trim();

    if (!texteFinal || texteFinal.length < 200) {
      return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
    }

    console.log("✅ Texte généré avec succès.");
    res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
