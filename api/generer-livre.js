export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    console.error("❌ Clé API ou historique invalide");
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("📥 Appel reçu avec", historique.length, "messages");

  // 🔹 Étape 1 : Extraire les réponses utilisateur
  const reponses = historique
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.trim());

  // 🔹 Étape 2 : Segmenter par blocs de 4
  const groupes = [];
  for (let i = 0; i < reponses.length; i += 4) {
    groupes.push(reponses.slice(i, i + 4).join("\n\n"));
  }

  console.log("📦 Total de segments à générer :", groupes.length);

  // 🔹 Prompts
  const promptSysteme = "Tu es un biographe professionnel.";
  const promptUserBase = `Voici une partie d’interview biographique.

Ta mission :
- Rédiger un passage fluide, littéraire, humain et chronologique.
- N’invente rien. N’ajoute aucune information.
- N’utilise que le contenu ci-dessous.

Contenu :
`;

  const morceaux = [];

  for (const [i, bloc] of groupes.entries()) {
    console.log(`🧩 Bloc ${i + 1} :`, bloc.slice(0, 100) + "...");

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenAI API erreur pour le bloc ${i + 1} :`, errorText);
        return res.status(500).json({
          message: `Erreur OpenAI pour le bloc ${i + 1}`,
          detail: errorText
        });
      }

      const data = await response.json();
      const texte = data?.choices?.[0]?.message?.content;

      if (texte) {
        console.log(`✅ Bloc ${i + 1} reçu`);
        morceaux.push(texte.trim());
      } else {
        console.warn(`⚠️ Bloc ${i + 1} vide`);
      }

    } catch (err) {
      console.error(`❌ Exception pendant la génération du bloc ${i + 1} :`, err);
    }
  }

  const texteFinal = morceaux.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    console.error("❌ Le texte généré est vide ou trop court.");
    return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
  }

  console.log("📘 Texte final généré avec succès — longueur :", texteFinal.length);
  return res.status(200).json({ texte: texteFinal });
}
