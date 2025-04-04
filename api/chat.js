// api/chat.js – Backend sécurisé pour LifeBook

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const { messages } = req.body;

  if (!apiKey) {
    console.error("❌ Clé API manquante");
    return res.status(500).json({ message: "Clé API non trouvée dans les variables d'environnement" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur dans la réponse OpenAI :", errorText);
      return res.status(500).json({ message: "Erreur dans la réponse OpenAI", detail: errorText });
    }

    const data = await response.json();
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("❌ Erreur lors de l'appel à l'API OpenAI :", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}
