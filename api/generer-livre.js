export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("🚀 Envoi de l’historique complet au backend…");

  const reponses = historique
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content.trim())
    .filter(Boolean); // évite les vides

  const groupes = reponses.map((r) => r); // un bloc = une réponse

  const promptSysteme = "Tu es un biographe professionnel, littéraire et humain.";
  const promptUserBase = `Voici une partie d’interview biographique.

Ta mission :
- Rédige un passage narratif fluide, chronologique et chaleureux à partir du contenu fourni.
- Utilise un style littéraire simple mais expressif, humain, sans artifices.
- Ne reformule pas les questions. N’invente rien. Utilise uniquement les éléments ci-dessous.

Contenu :
`;

  const results = await Promise.allSettled(
    groupes.map(async (bloc, i) => {
      try {
        console.log(`📤 Bloc ${i + 1}/${groupes.length} envoyé`);
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
        return data?.choices?.[0]?.message?.content?.trim() || "";
      } catch (err) {
        console.error(`❌ Erreur sur le bloc ${i + 1} :`, err);
        return "";
      }
    })
  );

  const morceaux = results
    .filter(r => r.status === "fulfilled" && r.value && r.value.length > 0)
    .map(r => r.value);

  const texteFinal = morceaux.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est trop court ou vide." });
  }

  console.log("📘 Texte final généré avec succès.");
  return res.status(200).json({ texte: texteFinal });
}
