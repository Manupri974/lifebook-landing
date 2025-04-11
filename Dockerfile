# ✅ Base officielle avec Node.js + Chromium intégré
FROM zenika/node:20-chrome

# Crée le dossier d’app
WORKDIR /app

# Copie les fichiers package.json / lock
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie tout le reste du projet
COPY . .

# Expose le port attendu par Render
EXPOSE 3000

# Lance le serveur
CMD ["npm", "start"]
