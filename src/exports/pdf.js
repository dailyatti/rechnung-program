import html2pdf from 'html2pdf.js';
import { $ } from '../utils.js';
import { state } from '../state.js';

export async function exportPDF() {
  const name = `Rechnung_${state.currentInvoice.invoiceNo || "export"}.pdf`.replace(/[^\w\-.]+/g, "_");
  await html2pdf().set({
    margin: 0,
    filename: name,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2.5, useCORS: true, logging: false, backgroundColor: "#ffffff" },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["css", "legacy"] }
  }).from($("paper")).save();
}
