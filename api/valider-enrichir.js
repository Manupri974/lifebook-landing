// 📁 Fichier : /pages/api/valider-enrichir.js

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Méthode non autorisée");

  const { question, reponse } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!question || !reponse) return res.status(400).json({ error: "Paramètres manquants" });
  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  const prompt = `
Tu es un biographe attentif. Voici une question d’interview et une réponse donnée par la personne interrogée.

1. Dis-moi si la réponse est exploitable pour écrire un texte biographique (réponds uniquement par "oui" ou "non").
2. Si ce n’est pas le cas, explique brièvement pourquoi.
3. Si la réponse est valide, réécris-la dans un style narratif chaleureux et vivant, sans inventer de faits mais en ajoutant du style, du contexte ou des émotions si possible.

Q : ${question}
R : ${reponse}
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
          { role: "system", content: "Tu es un biographe professionnel" },
          { role: "user", content: prompt }
        ],
        temperature: 1.1,
      })
    });

    const data = await openaiRes.json();
    const output = data.choices?.[0]?.message?.content || "";

    res.status(200).json({ resultat: output });
  } catch (err) {
    console.error("Erreur enrichissement:", err);
    res.status(500).json({ error: "Erreur lors de l'appel à OpenAI" });
  }
}
