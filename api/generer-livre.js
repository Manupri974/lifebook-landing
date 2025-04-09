// /pages/api/generer-livre.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  try {
    // Étape 1 : Créer le prompt global avec tout l'historique
    const contenu = historique
      .filter(msg => msg.role === 'user')
      .map((msg, i) => `Q${i + 1}: ${msg.content}`)
      .join('\n');

    const messages = [
      {
        role: 'system',
        content: `Tu es un biographe professionnel, chaleureux et intelligent.
Ta mission :
- Écrire un récit biographique fluide, littéraire, humain et chronologique.
- Raconte la vie de la personne comme une histoire captivante, sans titres ni numéros.
- Utilise uniquement les réponses fournies. N'invente rien. Ne répète pas les questions.
- Rends le style aussi narratif que possible, en alternant les phrases longues et courtes, avec une belle variation de rythme.
- Focalise-toi sur les détails concrets, les souvenirs vivants, les émotions ressenties.

Voici les réponses recueillies lors de l'interview :`
      },
      {
        role: 'user',
        content: contenu
      }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 1.2,
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur OpenAI:", errorText);
      return res.status(500).json({ message: "Erreur OpenAI", detail: errorText });
    }

    const data = await response.json();
    const texte = data?.choices?.[0]?.message?.content;

    if (!texte || texte.length < 100) {
      return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
    }

    res.status(200).json({ texte });
  } catch (err) {
    console.error("Erreur serveur :", err);
    res.status(500).json({ message: "Erreur serveur", detail: err.message });
  }
}
