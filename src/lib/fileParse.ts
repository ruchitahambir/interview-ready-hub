// Parse resume / JD files in the browser. Supports PDF, DOCX, TXT.
// .doc (legacy) is best-effort.

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return await file.text();
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return await extractPdf(file);
  }
  if (name.endsWith(".docx")) {
    return await extractDocx(file);
  }
  if (name.endsWith(".doc")) {
    // Best effort — usually unreadable. Suggest paste.
    const buf = await file.arrayBuffer();
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const cleaned = text.replace(/[^\x20-\x7E\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
    if (cleaned.length < 100) {
      throw new Error("Could not read .doc file. Please paste the text or upload a PDF/DOCX.");
    }
    return cleaned;
  }
  throw new Error("Unsupported file type. Use PDF, DOCX, DOC, or TXT.");
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Use bundled worker via Vite worker URL
  const workerSrc = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return text.trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || "").trim();
}
