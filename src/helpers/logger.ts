import chalk, { Chalk } from "chalk"

import { MODE } from "./consts"

import type { LoggerActions, LoggerTheme } from "../types"
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
			if (typeof params.spaceContent === "undefined") params.spaceContent = true
		}

		return params
	}
}

class LoggerBase extends Primitives {
	constructor() {
		super()
	}

	public Log(params: LoggerActions | string): void {
		params = this.format(params)
		if (!this.isActive) return

		if (typeof params === "string") {
			console.log(this.theme.log(params))
			return
		} else console.log(this.theme.log(params.message + "\n"))
	}

	public Sucessful(params: LoggerActions | string): void {
		params = this.format(params)
		if (!this.isActive) return

		if (typeof params === "string") {
			console.log(`${this.theme.success(params)}`)
			return
		}
		const message = `${params.message}\n`

		console.log(this.theme.success(message))
	}

	public Info(params: LoggerActions | string): void {
		params = this.format(params)
		if (!this.isActive) return

		if (typeof params === "string") {
			console.log(this.theme.info(params))
			return
		}
		const message = `${params.message}\n`

		console.log(this.theme.info(message))
	}

	public Warn(params: LoggerActions | string): void {
		if (typeof params === "string") {
			console.log(this.theme.warning(params))
			return
		}

		const message = `${params.message}\n`
		console.log(this.theme.warning(message))
	}

	public Error(params: LoggerActions | string): void {
		params = this.format(params)

		if (typeof params === "string") {
			console.log(this.theme.error(params))
			return
		}
		const message = `${params.message}\n`
		console.log(this.theme.error(message))
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
