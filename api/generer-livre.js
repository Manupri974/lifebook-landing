export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi de l’historique complet à OpenAI (biographie complète)");

  // On extrait toutes les réponses utilisateur
  const contenuUtilisateur = historique
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.trim())
    .join("\n\n");

  const promptSysteme = `Tu es un biographe professionnel, littéraire et humain.`;
  
  const promptUser = `
Voici une interview biographique d'une personne. 

Ta mission :
- Rédige une **biographie complète** à partir de ces réponses.
- Utilise un **style littéraire classique et appuyé
- Adopte le **ton de la troisième personne** (ex: "Jacques est né en 1956...").
- Structure le récit de manière **chronologique**.
- **N’oublie aucun élément** mentionné dans les réponses.
- **Brode** autour des anecdotes et souvenirs pour créer un texte **riche, nuancé et cohérent**, comme un chapitre de roman.
- Fais preuve de liberté dans ton interprétation pour générer un récit captivant d'au moins 10 pages

Voici les réponses de l’interview :

${contenuUtilisateur}
`;

  // 👀 Voir le prompt complet dans la console
  console.log("🧾 Prompt envoyé à OpenAI :\n", promptUser);

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
          { role: "user", content: promptUser }
        ]
      })
    });

    const data = await response.json();
    const texteFinal = data?.choices?.[0]?.message?.content?.trim();

    if (!texteFinal || texteFinal.length < 100) {
      return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
    }

    console.log("✅ Texte généré avec succès.");
    res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
