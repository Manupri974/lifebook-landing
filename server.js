import express from "express";
import genererLivre from "./api/generer-livre.js";
import exporterPdf from "./api/exporter-pdf.js"; // ✅ nouveau

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.post("/api/generer-livre", genererLivre);
app.use("/api/exporter-pdf", exporterPdf); // ✅ nouveau

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
