import fs from "fs";
import * as pdfParseLib from "pdf-parse";

const pdfParse = pdfParseLib.default || pdfParseLib;

export const extractTextFromPDF = async (filePath) => {
  const dataBuffer = await fs.promises.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};