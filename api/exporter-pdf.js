import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { texte } = req.body;

    if (!texte || texte.trim().length < 100) {
      return res.status(400).json({ error: 'Texte insuffisant pour générer un PDF.' });
    }

    // Lire le template HTML
    const templatePath = path.resolve('templates', 'template.html');
    let html = await fs.readFile(templatePath, 'utf-8');

    // Formatter le texte
    const contenu = texte
      .split(/\n+/)
      .map((p) => {
        if (/^Chapitre\s+\d+/i.test(p.trim())) {
          return `<h2 class="chapitre">${p.trim()}</h2>`;
        }
        return `<p>${p.trim()}</p>`;
      })
      .join("\n");

    html = html.replace("<!-- contenu injecté dynamiquement -->", contenu);

    // Lancer Puppeteer avec chemin Chrome forcé
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROME_BIN || '/usr/bin/google-chrome', // 🔥 le bon chemin pour Render
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A5',
      printBackground: true,
      margin: {
        top: '25mm',
        bottom: '25mm',
        left: '25mm',
        right: '25mm',
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=lifebook.pdf');
    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Erreur export PDF :", err);
    res.status(500).json({ error: "Erreur serveur lors de la génération du PDF." });
  }
});

export default router;
