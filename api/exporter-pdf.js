// /api/exporter-pdf.js
import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { texte } = req.body;

    if (!texte || texte.trim().length < 100) {
      return res.status(400).json({ error: 'Texte insuffisant pour générer un PDF.' });
    }

    // Construction du HTML stylisé
    const html = `
      <html>
        <head>
          <style>
            @page {
              size: A5;
              margin: 25mm 20mm 25mm 30mm;
            }
            body {
              font-family: 'Georgia', serif;
              font-size: 11pt;
              line-height: 1.6;
              text-align: justify;
            }
            h2 {
              text-align: center;
              font-size: 14pt;
              margin-top: 2em;
            }
            p {
              margin-bottom: 1em;
            }
            .page-break {
              page-break-before: always;
            }
          </style>
        </head>
        <body>
          ${texte
            .split("\n")
            .map(p => p.trim().startsWith("Chapitre") ? `<h2>${p.trim()}</h2>` : `<p>${p.trim()}</p>`)
            .join("\n")}
        </body>
      </html>
    `;

    const browser = await puppeteer.launch({
      headless: true,
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
        left: '30mm',
        right: '20mm',
      }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=lifebook.pdf');
    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Erreur export PDF :", err);
    res.status(500).json({ error: "Erreur serveur lors de la génération du PDF." });
  }
});

export default router;
