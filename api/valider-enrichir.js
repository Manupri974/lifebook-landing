export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Méthode non autorisée");

  const { question, reponse } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!reponse) return res.status(400).json({ error: "Paramètre 'reponse' manquant" });
  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  const prompt = `
Tu es un biographe professionnel.

Voici une réponse d’interview donnée par une personne. Ta mission est de transformer cette réponse en un paragraphe narratif, fluide, littéraire et chaleureux — sans ajouter d'éléments fictifs.

Tu ne dois pas reformuler la question, ni la mentionner. Tu dois uniquement écrire une version enrichie et romancée de la réponse, comme dans un livre.

Voici la réponse brute :

${reponse}
`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Tu es un biographe littéraire expert en récits de vie." },
          { role: "user", content: prompt }
        ],
        temperature: 1.1,
      })
    });

    const data = await openaiRes.json();
    const output = data.choices?.[0]?.message?.content || "";

    res.status(200).json({ resultat: output.trim() });
  } catch (err) {
    console.error("❌ Erreur enrichissement:", err);
    res.status(500).json({ error: "Erreur lors de l'appel à OpenAI" });
  }
}
