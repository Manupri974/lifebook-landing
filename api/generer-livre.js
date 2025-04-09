// 🔹 Version backend segmentée avec prompt renforcé pour chaque bloc
// 🔸 Sécurisation JSON + découpage en blocs de 2 pour éviter timeout

declare const fetch: typeof globalThis.fetch;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  const reponses = historique.filter(msg => msg.role === 'user').map(msg => msg.content.trim());

  const groupes = [];
  for (let i = 0; i < reponses.length; i += 2) {
    groupes.push(reponses.slice(i, i + 2).join("\n\n"));
  }

  const promptSysteme = `Tu es un biographe professionnel. Tu écris une biographie à partir de fragments de souvenirs. Ton style est : littéraire, fluide, humain, sobre, évocateur. Tu n'inventes rien. Tu racontes la vie comme une histoire touchante.`;

  const promptUserBase = `Voici un extrait de réponses biographiques.

Ta mission :
- Rédiger un passage littéraire et humain, en intégrant les émotions et les détails.
- Le style doit être fluide, profond et cohérent avec une biographie publiable.
- Utilise uniquement le contenu ci-dessous (ne réinvente rien).

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

      const textRaw = await response.text();
      try {
        const data = JSON.parse(textRaw);
        const texte = data?.choices?.[0]?.message?.content;
        if (texte) morceaux.push(texte.trim());
      } catch (jsonErr) {
        console.error("❌ Erreur JSON (contenu brut) :", textRaw);
        throw jsonErr;
      }

    } catch (err) {
      console.error("Erreur sur un segment :", err);
    }
  }

  const texteFinal = morceaux.join("\n\n");

  if (!texteFinal || texteFinal.length < 100) {
    return res.status(500).json({ message: "Le texte généré est vide ou trop court." });
  }

  res.status(200).json({ texte: texteFinal });
}
