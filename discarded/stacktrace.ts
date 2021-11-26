import path from "path"
import readline from "readline"
import fs from "graceful-fs"

import { STACK_REGEX } from "./src/helpers/consts"
import { Observable } from "src/helpers/utils"
import Logger from "src/helpers/logger"

type parserReturn = { lineNum: number; columnNum: number; Path: string } | null

type linesType = {
	line: string
	number: string
	main?: boolean
}

/* Stack parser is a class that holds ways to parse errors for different module bundlers */
abstract class StackParsers {
	protected parserRollup(err: string): parserReturn {
		const match = err.match(STACK_REGEX.rollup)

		if (!match) return null

		const numRegex = /[0-9]+/g
		const lineMatch = match[0].match(numRegex)

		if (!lineMatch) return null

		const Path = match[0].replace(`(${lineMatch[0]},${lineMatch[1]})`, "")
		const lineNum = parseInt(lineMatch[0])
		const columnNum = parseInt(lineMatch[1])

		return { lineNum, columnNum, Path }
	}
}

export class StackTrace extends StackParsers {
	private logger: Logger
	private isDone: Observable<boolean>

	constructor() {
		super()
		this.isDone = new Observable<boolean>(false)
		this.logger = Logger.getInstance()
	}

	getStack(err: string, packagePath: string): boolean {
		const parsed = this.parseStack(err)

		if (!parsed) return false

		const { Path, lineNum } = parsed

		const fullPath = this.getFullPath(path.normalize(Path), packagePath)

		const reader = this.lineReader(fullPath)

		let count = 1
		const lines: linesType[] = []

		const readLines = (line: string): void => {
			if (lineNum === count) lines.push({ line, number: count.toString(), main: true })
			else if (lineNum >= 2) {
				if (count >= lineNum - 2 && count <= lineNum + 2)
					lines.push({ line, number: count.toString() })
				else if (count >= lineNum + 2) this.isDone.setValue(true)
			} else if (lineNum < 2 && count < lineNum + 5) {
				lines.push({ line, number: count.toString() })
				reader.removeAllListeners()
				if (count > lineNum + 5) this.isDone.setValue(true)
			}
			count += 1
		}

		reader.on("line", readLines)
		this.isDone.onChange(() => {
			if (this.isDone.value) {
				reader.removeListener("line", readLines)
				reader.close()
				process.stdout.write(this.formatStack(err, lines))
			}
		})

		this.cleanup()

		return true
	}

	private formatStack(err: string, lines: linesType[]): string {
		const dimTheme = this.logger.Raw({ dim: true }, "log")
		const Theme = this.logger.Raw({ bold: true }, "log")
		lines.forEach((line) => {
			if (!line.main) {
				line.number = dimTheme(line.number)
				line.line = dimTheme(line.line)
			} else {
				line.number = Theme(line.number)
				line.line = Theme(line.line)
			}
		})

		return `
${this.logger.theme.text.error(err)}
――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
axaxa
${lines.map((line) => `${line.number || ""} | ${line.line.trimLeft() || ""} \n`)}
――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――――
        `
	}

	private parseStack(err: string): { lineNum: number; Path: string } | null {
		return this.parserRollup(err)
	}

	private getFullPath(Path: string, packagePath: string): string {
		if (!path.isAbsolute(Path)) Path = path.join(packagePath, Path)

		return Path
	}

	private lineReader(path: string): readline.Interface {
		return readline.createInterface({ input: fs.createReadStream(path) })
	}

	private cleanup(): void {
		this.isDone.setValue(false)
	}
}
