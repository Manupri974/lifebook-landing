export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texte requis' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: text,
        response_format: 'mp3'
      })
    });

    const audioBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename=\"voice.mp3\"');
    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Erreur synthèse vocale :', error);
    res.status(500).json({ error: 'Erreur de synthèse vocale' });
  }
}
