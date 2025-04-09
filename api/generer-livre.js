// /api/generer-livre.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey) {
    console.error("❌ Clé API manquante");
    return res.status(500).json({ message: "Clé API manquante" });
  }

  if (!historique || !Array.isArray(historique)) {
    console.error("❌ Historique invalide :", historique);
    return res.status(400).json({ message: "Historique invalide" });
  }

  console.log("📥 Réception de l'historique avec", historique.length, "messages");

  // Étape 1 : extraire les réponses utilisateur
  const reponses = historique
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.trim());

  console.log("🧾 Réponses utilisateur extraites :", reponses.length);

  // Étape 2 : regrouper les réponses par blocs de 4
  const groupes = [];
  for (let i = 0; i < reponses.length; i += 4) {
    groupes.push(reponses.slice(i, i + 4).join("\n\n"));
  }

  console.log("📦 Groupes créés :", groupes.length);

  const promptSysteme = "Tu es un biographe professionnel.";
  const promptUserBase = `
Voici une partie d’interview biographique.

Ta mission :
- Rédiger un passage fluide, littéraire, humain et chronologique.
- N’invente rien. N’ajoute aucune information.
- N’utilise que le contenu ci-dessous.

Contenu :
`;

  const morceaux = [];

  for (const [index, bloc] of groupes.entries()) {
    console.log(`📤 Envoi du bloc ${index + 1}/${groupes.length} :`, bloc.slice(0, 80), "...");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`❌ Erreur OpenAI (bloc ${index + 1}) :`, data);
        continue;
      }

      const texte = data.choices?.[0]?.message?.content;
      if (texte) {
        morceaux.push(texte.trim());
        console.log(`✅ Segment ${index + 1} généré.`);
      } else {
        console.warn(`⚠️ Pas de texte généré pour le bloc ${index + 1}.`);
      }

    } catch (err) {
      console.error(`❌ Erreur pendant la génération du bloc ${index + 1} :`, err);
    }
  }

  const texteFinal = morceaux.join("\n\n");

  console.log("📘 Texte final généré, longueur :", texteFinal.length);

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
  }

  return res.status(200).json({ texte: texteFinal });
}
