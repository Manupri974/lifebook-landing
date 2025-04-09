export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi de l’historique complet en une seule fois à OpenAI...");

  const promptSysteme = "Tu es un biographe professionnel, littéraire et humain.";
  const promptUser = `
Voici une interview biographique. Ta mission :
- Rédige un récit fluide, structuré et chaleureux à partir de l’ensemble des réponses utilisateur.
- Utilise un style littéraire simple, expressif et humain.
- Ne reformule pas les questions. N’invente rien. Utilise uniquement les réponses.
  
Contenu :
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
      return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
    }

    console.log("✅ Texte généré avec succès.");
    res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
