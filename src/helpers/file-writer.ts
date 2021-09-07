import fs from "fs"
import path from "path"
import { Dict } from "src/types"

import { TMP_DIR } from "./consts"

/* 
  Exports
*/
export const WriteFile = (fileName: string, fileSize: number, filePath: string): void => {
	CreateFile(fileName)
	const parsedData = readFile(fileName)
	parsedData[filePath] = fileSize

	const data = JSON.stringify(parsedData)

	fs.writeFileSync(path.join(TMP_DIR, fileName), data, "utf-8")
}

export const InterpretFile = (fileName: string, filePath: string): number | null => {
	const parsedData = readFile(fileName)
	const entry = parsedData[filePath] || null

	return entry
}

export const RemoveFile = (fileName: string): void => {
	try {
		fs.rmSync(path.join(TMP_DIR, fileName))
	} catch (err) {
		// Ignore
	}
}

export const CreateFile = (fileName: string): boolean => {
	const exists = fs.existsSync(path.join(TMP_DIR, fileName))

	if (!exists) {
		const data = JSON.stringify({})
		fs.writeFileSync(path.join(TMP_DIR, fileName), data, "utf-8")
	}
	return exists
}

/* 
  Helpers
*/
const readFile = (fileName: string): Dict<number> => {
	CreateFile(fileName)
	const payload = fs.readFileSync(path.join(TMP_DIR, fileName), "utf8")

	return JSON.parse(payload)
}
