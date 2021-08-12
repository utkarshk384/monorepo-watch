import fs from "fs";
import path from "path";

import type { Dict } from "../types";

const FILE_NAME = ".sizes.json";

/* 
  Exports
*/
export const WriteFile = (
  root: string,
  fileSize: number,
  filePath: string
): void => {
  createFile(root);
  const parsedData = readFile(root);
  parsedData[filePath] = fileSize;

  const data = JSON.stringify(parsedData);

  fs.writeFileSync(path.join(root, FILE_NAME), data, "utf-8");
};

export const InterpretFile = (
  root: string,
  filePath: string
): number | null => {
  const parsedData = readFile(root);
  const entry = parsedData[filePath] || null;

  return entry;
};

export const RemoveFile = (root: string) => {
  fs.rmSync(path.join(root, FILE_NAME));
};

/* 
  Helpers
*/
const createFile = (root: string) => {
  const exists = fs.existsSync(path.join(root, `/${FILE_NAME}`));

  if (!exists) {
    const data = JSON.stringify({});
    fs.writeFileSync(path.join(root, FILE_NAME), data, "utf-8");
  }
  return exists;
};

const readFile = (root: string): Dict<number> => {
  createFile(root);
  const payload = fs.readFileSync(path.join(root, FILE_NAME), "utf8");

  return JSON.parse(payload);
};
