export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: 'Clé API ou historique manquant/invalide' });
  }

  console.log("📚 Lancement de la génération multi-prompt par question...");

  const blocks = historique.filter(m => m.role === 'user');
  const chapitreParReponse = [];

  for (let i = 0; i < blocks.length; i++) {
    const contenu = blocks[i].content.trim();
    const prompt = `Tu es un écrivain biographique. Rédige un paragraphe littéraire et expressif à partir de cette réponse d'interview. N'invente rien. Décris, illustre, développe le style, et fais ressortir les émotions.

Réponse : "${contenu}"`;

    console.log(`✏️ Génération du bloc ${i + 1} / ${blocks.length}`);

    try {
      const resBloc = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 1.1,
          messages: [
            { role: "system", content: "Tu es un écrivain biographique qui développe chaque souvenir avec chaleur et style." },
            { role: "user", content: prompt }
          ]
        })
      });

      const blocJson = await resBloc.json();
      const texte = blocJson?.choices?.[0]?.message?.content?.trim();
      if (texte && texte.length > 50) {
        chapitreParReponse.push(texte);
      } else {
        console.warn(`⚠️ Bloc ${i + 1} trop court ou vide.`);
      }

    } catch (err) {
      console.error(`❌ Erreur pendant la génération du bloc ${i + 1} :`, err);
    }
  }

  console.log("🔁 Fusion des blocs générés...");

  const promptFinal = `Voici plusieurs fragments de récits biographiques. Unifie-les en un texte littéraire fluide, structuré en chapitres cohérents avec titres. Développe les transitions, harmonise le ton, et garde une narration chaleureuse et humaine.

Fragments :

${chapitreParReponse.map((c, i) => `Chapitre ${i + 1} :\n${c}`).join("\n\n")}`;

  try {
    const resFinal = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 1.1,
        messages: [
          { role: "system", content: "Tu es un biographe professionnel, humain et inspiré." },
          { role: "user", content: promptFinal }
        ]
      })
    });

    const finalJson = await resFinal.json();
    const texteFinal = finalJson?.choices?.[0]?.message?.content?.trim();

    if (!texteFinal || texteFinal.length < 300) {
      return res.status(500).json({ message: "Le texte final est vide ou trop court." });
    }

    console.log("✅ Texte final généré avec succès.");
    res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la fusion finale :", err);
    res.status(500).json({ message: "Erreur serveur pendant la génération finale." });
  }
}
