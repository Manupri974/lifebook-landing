export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  // 🔹 Étape 1 : Récupérer uniquement les réponses utilisateur
  const reponses = historique
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.trim())
    .filter(Boolean);

  if (reponses.length < 5) {
    return res.status(400).json({ message: "Pas assez de réponses pour générer un texte." });
  }

  // 🔹 Étape 2 : Créer le prompt complet
  const promptSysteme = "Tu es un biographe professionnel.";
  const promptUser = `
Voici une série de réponses fournies par une personne dans le cadre d’une interview biographique.

Ta mission :
- Rédiger une biographie fluide, littéraire, humaine et **chronologique**.
- Tu dois **raconter sa vie comme une histoire**, avec un style narratif sobre et chaleureux.
- N’invente rien. Ne reformule pas les questions. Ne copie pas les numéros. Utilise **uniquement** les éléments ci-dessous.

Réponses :
${reponses.map(r => "- " + r).join("\n\n")}
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
        temperature: 1.2,
        messages: [
          { role: "system", content: promptSysteme },
          { role: "user", content: promptUser }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur OpenAI :", errorText);
      return res.status(500).json({ message: "Erreur OpenAI", detail: errorText });
    }

    const data = await response.json();
    const texte = data?.choices?.[0]?.message?.content;

    if (!texte || texte.length < 100) {
      return res.status(500).json({ message: "Texte généré trop court ou vide." });
    }

    return res.status(200).json({ texte });
  } catch (err) {
    console.error("❌ Erreur serveur :", err);
    return res.status(500).json({ message: "Erreur serveur", detail: err.message });
  }
}
