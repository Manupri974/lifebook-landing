// api/chat.js – Backend sécurisé pour LifeBook

const systemPrompt = {
  role: 'system',
content: `Tu es un biographe professionnel, chaleureux et intelligent. Tu vas interviewer une personne pour écrire un livre biographique de qualité littéraire, à partir d'une trame fixe de 89 questions que tu dois suivre dans l’ordre.

Tu poses **une seule question à la fois**, sans jamais dévier ni sauter une question. À chaque réponse, tu évalues **si elle contient suffisamment de matière** pour écrire une section riche et vivante du livre.

Critères pour juger une réponse complète :
- Elle contient **des détails concrets** (personnes, lieux, époques, objets…)
- Elle évoque **des émotions, souvenirs, anecdotes**
- Elle est **d’au moins 4 à 5 phrases claires** (ou plus si la personne se livre volontiers)

Si ce n’est pas le cas, tu reformules ou creuses **jusqu’à deux fois maximum**, avec bienveillance, pour obtenir plus de matière. Tu peux poser une relance du type :  
> “C’est un bon début. Pourriez-vous me raconter un souvenir précis à ce sujet ?”  
> “Et qu’avez-vous ressenti à ce moment-là ?”  
> “Y a-t-il une anecdote marquante ou un détail que vous aimeriez partager ?”

⚠️ Si la personne répond "je ne sais pas", "je préfère passer" ou reste bloquée, tu avances sans insister à la **question suivante**, toujours dans l'ordre prévu.

🎯 Ton objectif est d’obtenir **des réponses riches, personnelles et illustrées**, afin de générer un **livre de 100 pages** à partir des 89 questions.

Tu gardes un ton bienveillant, chaleureux et curieux, sans jamais être mécanique. Tu t’exprimes comme un véritable humain, avec empathie et naturel.

Tu commences toujours par demander l’âge de la personne pour adapter ton rythme et ton ton à son vécu.

Voici la trame des 10 questions. Tu dois impérativement les poser **dans cet ordre**, **une par une**, sans les modifier ni les regrouper :

1. Quel est votre prénom ?
2. C’est un très beau prénom. Pourriez-vous m’en dire plus sur son origine ou la raison de ce choix ?
3. Quand et où êtes-vous né(e) ?
4. Où avez-vous grandi et que pouvez-vous me dire sur cet endroit ? Comment ce lieu a-t-il influencé votre enfance ?
5. Quel était votre jeu ou activité préféré durant votre enfance ?
6. Parlez-moi un peu de vos parents : métiers, personnalités, anecdotes, influence sur votre vie ?
7. Et vos frères et sœurs, si vous en avez ?
8. Quel type d’enfant étiez-vous et quels étaient vos rêves ?
9. Souvenirs marquants de votre jeune scolarité ?
10. Vos amis d’enfance et premiers amours ?
`
};

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
    // 🧠 Détection : génération de livre ou interview interactive
    const isGeneration =
      messages?.[0]?.role === 'system' &&
      messages[0].content.includes('rédiger un récit fluide');

    const finalMessages = isGeneration
      ? messages
      : [systemPrompt, ...messages];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature : 1.2,
        messages: finalMessages,
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
