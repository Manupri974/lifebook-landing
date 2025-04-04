export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texte manquant' });
  }

  const openaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "tts-1",        // Ou "tts-1-hd"
      voice: "nova",         // Voix féminine naturelle
      input: text
    })
  });

  if (!openaiRes.ok) {
    const errorData = await openaiRes.json();
    return res.status(500).json({ error: "Erreur API OpenAI", detail: errorData });
  }

  const audioBuffer = await openaiRes.arrayBuffer();
  res.setHeader("Content-Type", "audio/mpeg");
  res.send(Buffer.from(audioBuffer));
}
