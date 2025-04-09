import { config } from "dotenv";
import fetch from "node-fetch";

config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Méthode non autorisée" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { historique } = req.body;

  if (!apiKey || !historique || !Array.isArray(historique)) {
    return res.status(400).json({ message: "Clé API ou historique manquant/invalide" });
  }

  const reponsesUtilisateur = historique.filter(m => m.role === "user").map(m => m.content.trim());
  console.log("🧩 Envoi à OpenAI - Nombre de réponses :", reponsesUtilisateur.length);

  // Nombre de réponses par séquence
  const tailleSequence = 3;

  const sequences = [];
  for (let i = 0; i < reponsesUtilisateur.length; i += tailleSequence) {
    const bloc = reponsesUtilisateur.slice(i, i + tailleSequence);
    if (bloc.length > 0) sequences.push(bloc);
  }

  try {
    const paragraphes = [];

    for (let i = 0; i < sequences.length; i++) {
      const contenu = sequences[i].join("\n\n");
      const prompt = `Voici une séquence d'interview biographique. Ta mission :\n
- Écris un passage narratif structuré, riche et fluide.\n- Utilise un style littéraire, humain, expressif.\n- Ne reformule pas les questions, inspire-toi uniquement des réponses.\n- Décris les émotions, les lieux, les ambiances.\n- Utilise des transitions naturelles.\n- Ce bloc doit faire entre 500 et 800 mots.\n\nContenu :\n"""\n${contenu}\n"""`;

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
            { role: "system", content: "Tu es un écrivain biographe talentueux, sensible et littéraire." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      const generated = data?.choices?.[0]?.message?.content?.trim();
      if (generated && generated.length > 100) {
        paragraphes.push(generated);
      } else {
        console.warn(`⚠️ Bloc ignoré à la séquence ${i + 1}`);
      }
    }

    const texteFinal = paragraphes.join("\n\n");
    console.log("✅ Texte généré avec succès. Longueur :", texteFinal.length);
    return res.status(200).json({ texte: texteFinal });

  } catch (err) {
    console.error("❌ Erreur pendant la génération :", err);
    return res.status(500).json({ message: "Erreur serveur pendant la génération." });
  }
}
