import fs from "fs";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const extractTextFromPDF = async (filePath) => {
  const dataBuffer = await fs.promises.readFile(filePath);

  const parser = new PDFParse({
    data: dataBuffer,
  });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
};

export const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({
    path: filePath,
  });

  return result.value || "";
};

export const extractTextFromTXT = async (filePath) => {
  return await fs.promises.readFile(filePath, "utf8");
};

export const extractTextFromFile = async (filePath, fileExtension) => {
  const ext = fileExtension
    .toLowerCase()
    .replace(".", "");

  switch (ext) {
    case "pdf":
      return await extractTextFromPDF(filePath);

    case "docx":
      return await extractTextFromDOCX(filePath);

    case "txt":
      return await extractTextFromTXT(filePath);

    default:
      throw new Error(
        `Unsupported file type: .${ext}. Supported types: PDF, DOCX, TXT`
      );
  }
};