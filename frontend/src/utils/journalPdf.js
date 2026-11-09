// Builds the journal PDF in the browser (nothing is uploaded) and saves or shares it.
// English only: the standard PDF font cannot draw Gujarati, Hindi or emoji, so those are removed.
//
// Needs one package:  npm install jspdf

const PAGE = { width: 210, height: 297, margin: 18, footer: 20 };

// Keep only characters the built-in PDF font can print.
function clean(text) {
  return String(text ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\n\x20-\x7E\u00A0-\u00FF]/g, "");
}

function niceDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function buildJournalPdf({ name, entries, rangeLabel }) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const textWidth = PAGE.width - PAGE.margin * 2;
  let y = PAGE.margin;

  function ensureSpace(height) {
    if (y + height > PAGE.height - PAGE.footer) {
      doc.addPage();
      y = PAGE.margin;
    }
  }

  function write(text, { size = 10, style = "normal", gap = 4, color = [45, 32, 40] } = {}) {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);

    const lineHeight = size * 0.5;
    const lines = doc.splitTextToSize(clean(text), textWidth);

    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, PAGE.margin, y + lineHeight * 0.8);
      y += lineHeight;
    });

    y += gap;
  }

  function rule() {
    ensureSpace(4);
    doc.setDrawColor(225, 205, 205);
    doc.line(PAGE.margin, y, PAGE.width - PAGE.margin, y);
    y += 5;
  }

  // Title block
  write("Femora journal", { size: 22, style: "bold", gap: 2, color: [160, 70, 55] });
  write(name || "Femora user", { size: 12, style: "bold", gap: 1 });
  write(`Created on ${niceDate(new Date().toLocaleDateString("en-CA"))}`, { size: 10, gap: 1 });
  write(`${rangeLabel} - ${entries.length} ${entries.length === 1 ? "entry" : "entries"}`, {
    size: 10,
    gap: 4,
  });
  rule();

  if (!entries.length) {
    write("There are no journal entries in this period.");
  }

  // Entries, oldest first
  entries.forEach((entry) => {
    ensureSpace(30);

    write(niceDate(entry.entryDate), { size: 12, style: "bold", gap: 1 });

    if (entry.cycleDay) {
      const phase = entry.phase ? `, ${entry.phase.toLowerCase()} phase` : "";
      write(`Cycle day ${entry.cycleDay}${phase}`, { size: 9, gap: 1, color: [120, 100, 108] });
    }

    if (entry.mood) {
      write(`Mood: ${entry.mood}`, { gap: 1 });
    }

    if (entry.symptoms?.length) {
      write(`Symptoms: ${entry.symptoms.join(", ")}`, { gap: 1 });
    }

    if (entry.note) {
      write(entry.note, { gap: 2 });
    }

    y += 1;
    rule();
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 115, 120);
    doc.text(
      "Femora provides wellness estimates and does not provide medical diagnosis.",
      PAGE.margin,
      PAGE.height - 12
    );
    doc.text(`Page ${page} of ${pages}`, PAGE.width - PAGE.margin, PAGE.height - 12, {
      align: "right",
    });
  }

  return doc.output("blob");
}

function isPhoneOrTablet() {
  const agent = navigator.userAgent || "";

  return (
    /Android|iPhone|iPad|iPod/i.test(agent) ||
    (/Macintosh/i.test(agent) && navigator.maxTouchPoints > 1)
  );
}

// On phones and tablets this opens the share sheet (Save to Files, WhatsApp, Drive...).
// Everywhere else, or if sharing is not available, it downloads the file.
// Returns "shared", "downloaded" or "cancelled".
export async function saveOrSharePdf(blob, filename) {
  const file = new File([blob], filename, { type: "application/pdf" });

  if (
    isPhoneOrTablet() &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], title: "Femora journal" });
      return "shared";
    } catch (error) {
      if (error && error.name === "AbortError") {
        return "cancelled";
      }
      // Sharing failed for another reason, so fall back to a normal download.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1500);

  return "downloaded";
}