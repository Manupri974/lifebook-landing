import express from "express";
import { genererLivreHandler } from "./api/generer-livre.js"; // ✅ IMPORT NOMMÉ

const app = express();
app.use(express.json());

// ✅ Middleware CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://lifebook-landing.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.post("/api/generer-livre", genererLivreHandler); // ✅ UTILISE LA FONCTION IMPORTÉE

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
