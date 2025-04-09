export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end("Méthode non autorisée");

  const { reponse } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!reponse) return res.status(400).json({ error: "Paramètre 'reponse' manquant" });
  if (!apiKey) return res.status(500).json({ error: "Clé API manquante" });

  const prompt = `
Transforme le texte suivant en un paragraphe narratif fluide, littéraire et humain.

Ne reformule pas le sujet. N’invente rien. N’ajoute aucun contexte. N’évoque pas la question. Utilise uniquement ce contenu.

Texte :
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
          { role: "system", content: "Tu es un biographe littéraire. Tu écris avec sensibilité, sans jamais inventer ni extrapoler." },
          { role: "user", content: prompt }
        ],
        temperature: 1.0,
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
