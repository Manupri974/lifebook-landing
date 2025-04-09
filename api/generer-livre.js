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

  function detecterCategorie(texte) {
    const categories = {
      "Enfance": ["jouet", "maternelle", "parents", "école", "copain", "grandir", "naissance", "quartier"],
      "Famille": ["mère", "père", "frère", "sœur", "famille", "grands-parents"],
      "Adolescence": ["collège", "lycée", "ado", "premier amour", "amis d'enfance", "rébellion"],
      "Études et travail": ["université", "études", "travail", "carrière", "job", "profession", "boulot"],
      "Amour et relations": ["amour", "relation", "couple", "mariage", "partenaire"],
      "Voyages": ["voyage", "pays", "ville", "étranger", "vacances"],
      "Aujourd'hui": ["retraite", "aujourd'hui", "présent", "maintenant", "vieux", "actuel"]
    };

    for (const [categorie, mots] of Object.entries(categories)) {
      for (const mot of mots) {
        if (texte.toLowerCase().includes(mot)) return categorie;
      }
    }
    return "Autres";
  }

  const groupes = {};
  for (const reponse of reponsesUtilisateur) {
    const categorie = detecterCategorie(reponse);
    if (!groupes[categorie]) groupes[categorie] = [];
    groupes[categorie].push(reponse);
  }

  try {
    const paragraphes = [];
    for (const [categorie, reponses] of Object.entries(groupes)) {
      const contenu = reponses.join("\n\n");
      const prompt = `Voici un ensemble de réponses issues d'une interview biographique, portant sur le thème "${categorie}" :\n\n"""\n${contenu}\n"""\n\nTa mission :\n- Rédige un chapitre structuré, expressif et littéraire.\n- Utilise un style narratif fluide, humain et chaleureux.\n- Décris les lieux, les sentiments, les ambiances.\n- Ne reformule pas les questions, ne cite pas les réponses directement.\n- Enrichis subtilement avec des transitions naturelles.\n- Le chapitre doit faire entre 700 et 900 mots pour couvrir au moins une page complète en PDF.\n- Commence par un titre en majuscules.`;

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
            { role: "system", content: "Tu es un écrivain professionnel de biographies humaines et littéraires." },
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      const generated = data?.choices?.[0]?.message?.content?.trim();
      if (generated && generated.length > 100) {
        paragraphes.push(generated);
      } else {
        console.warn(`⚠️ Chapitre ignoré pour le thème ${categorie}`);
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
