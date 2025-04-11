import express from "express";
import genererLivre from "./api/generer-livre.js";
// import exporterPdf from "./api/exporter-pdf.js"; // ❌ temporairement désactivé

const app = express();
app.use(express.json());

// ✅ CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ou limiter à vercel plus tard
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Route active uniquement
app.post("/api/generer-livre", genererLivre);

// ❌ temporairement désactivé pour vérifier qu'il ne casse pas tout
// app.use("/api/exporter-pdf", exporterPdf);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Serveur lancé correctement");
});
