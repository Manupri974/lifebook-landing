const prompt = `Tu es une biographe expérimentée.
Voici les réponses fournies par une personne dans le cadre d'une interview biographique :

${reponses}

Ta mission :
- Propose un **plan de livre clair et structuré**, avec 5 à 8 chapitres maximum.
- Chaque chapitre doit avoir :
  - Un **titre impactant** (niveau titre principal, en gras),
  - De **2 à 4 sections numérotées** (Section 1, Section 2...),
  - Chaque section contient **2 à 3 bullet points** qui détaillent les idées abordées.
- Utilise du markdown (## pour les chapitres, ### pour les sections, * pour les bullet points).
- Laisse des sauts de ligne pour aérer.
- Ne génère pas de texte final, uniquement le plan structuré.

Exemple de format :

## Chapitre 1 : Le départ

### Section 1.1 : L’enfance
* Naissance dans un petit village
* Premiers souvenirs
* Vie de famille

### Section 1.2 : Les premières aventures
* École et découvertes
* Premiers amis
* Goûts qui se développent

...

Termine en suggérant à l’utilisateur de modifier, réorganiser ou enrichir ce plan si besoin.`;
