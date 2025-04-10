// planManager.js
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

export const planManager = {
  mode: false,

  activer() {
    this.mode = true;
    console.log("📘 Mode Plan activé.");
  },

  desactiver() {
    this.mode = false;
    console.log("💬 Mode Plan désactivé.");
  },

  estActif() {
    return this.mode;
  },

  afficherMarkdown(titre, markdownText) {
    const msg = document.createElement("div");
    msg.className = "message bot";
    msg.innerHTML = `<strong>${titre} :</strong><div>${marked.parse(markdownText)}</div>`;
    document.getElementById("messages").appendChild(msg);
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
  }
};
