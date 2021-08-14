import fs from "fs";
import path from "path";

import { ROOT } from "./consts";

/* 
  Exports
*/
export const WriteFile = (
  fileName: string,
  fileSize: number,
  filePath: string
): void => {
  CreateFile(fileName);
  const parsedData = readFile(fileName);
  parsedData[filePath] = fileSize;

  const data = JSON.stringify(parsedData);

  fs.writeFileSync(path.join(ROOT, fileName), data, "utf-8");
};

export const InterpretFile = (
  fileName: string,
  filePath: string
): number | null => {
  const parsedData = readFile(fileName);
  const entry = parsedData[filePath] || null;

  return entry;
};

export const RemoveFile = (fileName: string) => {
  try {
    fs.rmSync(path.join(ROOT, fileName));
  } catch (err) {
    // Ignore
  }
};

export const CreateFile = (fileName: string) => {
  const exists = fs.existsSync(path.join(ROOT, fileName));

  if (!exists) {
    const data = JSON.stringify({});
    fs.writeFileSync(path.join(ROOT, fileName), data, "utf-8");
  }
  return exists;
};

/* 
  Helpers
*/
const readFile = (fileName: string) => {
  CreateFile(fileName);
  const payload = fs.readFileSync(path.join(ROOT, fileName), "utf8");

  return JSON.parse(payload);
};
