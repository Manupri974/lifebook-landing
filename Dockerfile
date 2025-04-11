# Image avec Chromium + fonts, base Debian
FROM browserless/chrome:latest

# ✅ Installer Node.js 20
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Création du dossier d'app
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code
COPY . .

# Port exposé
EXPOSE 3000

# Démarrage du serveur
CMD ["npm", "start"]
