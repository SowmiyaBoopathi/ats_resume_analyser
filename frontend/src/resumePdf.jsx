import { jsPDF } from "jspdf";

const styles = {
  name: { size: 18, bold: true },
  contact: { size: 9 },
  heading: { size: 11, bold: true },
  bold: { size: 10, bold: true },
  text: { size: 10 },
  bullet: { size: 10 },
};

const toBlocks = (r) => {
  const blocks = [];
  const add = (style, text) => text && blocks.push({ style, text });

  add("name", r.name);
  add("contact", [r.email, r.phone, ...(r.links || [])].filter(Boolean).join(" | "));

  if (r.objective) {
    add("heading", "OBJECTIVE");
    add("text", r.objective);
  }

  if (r.skills?.length) {
    add("heading", "SKILLS");
    r.skills.forEach((s) => add("text", `${s.category}: ${s.items}`));
  }

  if (r.experience?.length) {
    add("heading", "EXPERIENCE");
    r.experience.forEach((e) => {
      add("bold", [e.title, e.company].filter(Boolean).join(" | "));
      add("text", e.duration);
      e.points?.forEach((p) => add("bullet", p));
    });
  }

  if (r.projects?.length) {
    add("heading", "PROJECTS");
    r.projects.forEach((p) => {
      add("bold", p.tech ? `${p.name} (${p.tech})` : p.name);
      p.points?.forEach((pt) => add("bullet", pt));
    });
  }

  if (r.education?.length) {
    add("heading", "EDUCATION");
    r.education.forEach((e) => {
      add("bold", e.degree);
      add("text", [e.institution, e.year].filter(Boolean).join(", "));
    });
  }

  if (r.certifications?.length) {
    add("heading", "CERTIFICATIONS");
    r.certifications.forEach((c) => add("bullet", c));
  }

  return blocks;
};

export const resumeToText = (resume) =>
  toBlocks(resume)
    .map((b) => {
      if (b.style === "heading") return `\n${b.text}`;
      if (b.style === "bullet") return `• ${b.text}`;
      return b.text;
    })
    .join("\n");

export const downloadResumePdf = (resume) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;

  toBlocks(resume).forEach(({ style, text }) => {
    const { size, bold } = styles[style];
    const indent = style === "bullet" ? 12 : 0;

    if (style === "heading") y += 8;

    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);

    const lines = doc.splitTextToSize(text, pageW - margin * 2 - indent);

    lines.forEach((line, i) => {
      if (y > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      if (style === "bullet" && i === 0) doc.text("•", margin, y);
      doc.text(line, margin + indent, y);
      y += size * 1.35;
    });

    if (style === "heading") {
      doc.line(margin, y - size, pageW - margin, y - size);
      y += 2;
    }
  });

  doc.save(`${resume.name || "resume"}.pdf`);
};