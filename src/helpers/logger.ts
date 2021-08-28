import chalk, { Chalk } from "chalk"

import { MODE } from "./consts"

import type { LoggerActions, LoggerLevel, LoggerTheme } from "../types"
abstract class Primitives {
	public isActive: boolean
	public theme: LoggerTheme

	constructor() {
		this.isActive = false
		this.theme = {
			log: chalk.white,
			success: chalk.bgGreen.black,
			info: chalk.bgBlueBright.black,
			warning: chalk.yellowBright.black,
			error: chalk.bgRedBright.black,
			debug: chalk.bgMagentaBright.black,
		}
	}

	public ClearScreen(): void {
		if (MODE !== "debug") process.stdout.write("\x1Bc")
	}

	public LineBreak(): void {
		console.log("\n")
	}

	protected format(params: LoggerActions | string): LoggerActions | string {
		this.setDefaultConfig(params)
		if (typeof params !== "string") {
			if (params.br) params.message = params.message + "\n"

			/* For spacing */

			if (params.spaceContent) params.message = `  ${params.message}  `

			if (params.clr) this.ClearScreen()
		}
		return params
	}

	protected setDefaultConfig(params: LoggerActions | string): LoggerActions | string {
		if (typeof params !== "string") {
			if (typeof params.spaceContent === "undefined") params.spaceContent = false
		}

		return params
	}

	protected resolveTheme(level: LoggerLevel): chalk.Chalk {
		switch (level) {
			case "log":
				return this.theme.log
			case "success":
				return this.theme.success
			case "info":
				return this.theme.info
			case "warn":
				return this.theme.warning
			case "error":
				return this.theme.error
			case "debug":
				return this.theme.error
			default:
				return this.theme.log
		}
	}
}

class LoggerBase extends Primitives {
	constructor() {
		super()
	}

	public log(params: LoggerActions | string, level: LoggerLevel): void {
		const theme = this.resolveTheme(level)
		params = this.format(params)
		if (!this.isActive) return

		if (typeof params === "string") {
			console.log(theme(params))
			return
		} else console.log(theme(params.message))
	}

	public raw(params: LoggerActions | string, level: LoggerLevel): string {
		const theme = this.resolveTheme(level)
		params = this.format(params)

		if (typeof params === "string") return theme(params)
		else return theme(params.message)
	}

	public Custom(cb: (chalk: Chalk) => void): void {
		if (!this.isActive) return

		console.log(cb(chalk))
	}
}

export type LoggerType = LoggerBase

const Logger = (): LoggerBase => {
	return new LoggerBase()
}

export default Logger
