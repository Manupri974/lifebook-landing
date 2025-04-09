import express from "express";
import genererLivre from "./api/generer-livre.js";

const app = express();
app.use(express.json());

// ✅ Middleware CORS - autorise tous les domaines
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // 🔓 Ouverture totale (à restreindre en prod)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.post("/api/generer-livre", genererLivre);

// Render utilise automatiquement ce port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
