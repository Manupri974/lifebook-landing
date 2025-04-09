import express from "express";
import genererLivre from "./api/generer-livre.js";

const app = express();
app.use(express.json());

app.post("/api/generer-livre", genererLivre);

// Render utilise automatiquement ce port (important !)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
