export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  const prompt = `
Voici une série de réponses fournies par une personne dans le cadre d’une interview biographique.

Ta mission :
- Rédiger une biographie fluide, littéraire, humaine et **chronologique**.
- Tu dois **raconter sa vie comme une histoire**, avec un style narratif sobre et chaleureux.
- N’invente rien. Ne reformule pas les questions. Ne copie pas les numéros. Utilise **uniquement** les éléments ci-dessous.

Réponses :
${historique.filter(m => m.role === 'user').map(m => `- ${m.content.trim()}`).join('\n')}
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
          { role: "system", content: "Tu es un biographe professionnel." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    const texte = data?.choices?.[0]?.message?.content;
    if (!texte) throw new Error("Pas de texte généré.");

    res.status(200).json({ texte: texte.trim() });
  } catch (error) {
    console.error("Erreur génération livre :", error);
    res.status(500).json({ message: "Erreur OpenAI", detail: error.message });
  }
}
