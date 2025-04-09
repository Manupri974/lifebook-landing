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

  // Étape 1 : Extraire uniquement les réponses utilisateur
  const reponses = historique.filter(msg => msg.role === 'user').map(msg => msg.content.trim());

  // Étape 2 : Diviser en groupes de 4 réponses
  const groupes = [];
  for (let i = 0; i < reponses.length; i += 4) {
    groupes.push(reponses.slice(i, i + 4).join("\n\n"));
  }

  const promptSysteme = "Tu es un biographe professionnel.";
  const promptUserBase = `Voici une partie d’interview biographique.

Ta mission :
- Rédiger un passage fluide, littéraire, humain et chronologique.
- N’invente rien. N’ajoute aucune information.
- N’utilise que le contenu ci-dessous.

Contenu :\n`;

  const morceaux = [];

  for (const bloc of groupes) {
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
            { role: "user", content: promptUserBase + bloc }
          ]
        })
      });

      const data = await response.json();
      const texte = data?.choices?.[0]?.message?.content;
      if (texte) {
        morceaux.push(texte.trim());
      }
    } catch (err) {
      console.error("Erreur lors de la génération d’un segment :", err);
    }
  }

  const texteFinal = morceaux.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
  }

  res.status(200).json({ texte: texteFinal });
}
