import { Transform } from "stream"
import { spawn } from "cross-spawn"
import type { ChildProcess, StdioOptions } from "child_process"

import { ANSI_REGEX, YARN_ERROR_MSGS } from "src/helpers/consts"
import { Logger, convertPath, Observable, LoggerType } from "src/helpers"

import type { ActionOpts, InternalConfig, TransformType } from "src/types"

export class Spawner {
	public err: Observable<boolean>
	private root: string
	private config: InternalConfig
	private logger: LoggerType

	constructor(root: string, config: InternalConfig) {
		this.root = root
		this.config = config
		this.logger = Logger.getInstance()

		this.err = new Observable<boolean>(false)
	}

	public Spawn(options: ActionOpts): ChildProcess {
		const cp = spawn(this.config.runScripts[0], ["-s", ...this.config.runScripts.slice(1)], {
			env: process.env,
			cwd: options.packagePath,
			stdio: this.getStdIO(),
		})

		this.err.onChange((val) => {
			if (val) {
				cp.stderr?.removeListener("data", this.stderrCB)
			}
		})

		return cp
	}

	public PipeStream(cp: ChildProcess): void {
		const transformer = this.GenerateTransformer(async (chunk, _, done) => {
			const line = this.stripANSI(chunk)

			if (Spawner.shouldRemoveUnwanted(line)) {
				done()
				return
			}

			//TODO: Add a concrete way to catch error in the stream
			if (line.includes("error") && (await this.checkForError())) {
				this.logger.WithBackground("Error", line, "error")

				cp.kill()

				done()
				return
			}
			done(null, chunk)
		})

		if (cp.stdout) cp.stdout.pipe(transformer).pipe(process.stdout).setEncoding("utf-8")
		else if (!cp.stdout && !this.config.noChildProcessLogs)
			this.logger.WithBackground("Debug", "Couldn't pipe transformer to 'process.stdout'", "debug")
	}

	public AddListeners(cp: ChildProcess, eventName: string, options: ActionOpts): void {
		const relativePath = convertPath(this.root, options.filePath)

		cp.stderr?.on("Data", this.stderrCB)

		cp.once("close", (code) => {
			if (code === 0) this.logger.EndLogger(eventName, relativePath)
		})
	}

	public CleanUp(): void {
		this.err.setValue(false)
	}

	private static shouldRemoveUnwanted(line: string): boolean {
		let val = false

		if (line[0] === "$" || line === "") val = true
		else if (line.includes("exited with 2") || line.includes("exited with 1")) val = true
		else if (YARN_ERROR_MSGS.includes(line)) val = true

		return val
	}

	private getStdIO(): StdioOptions {
		return this.config.noChildProcessLogs ? "ignore" : ["inherit", "pipe", "pipe"]
	}

	private GenerateTransformer = (transform: TransformType): Transform => {
		return new Transform({
			encoding: "utf-8",
			transform,
			final(done) {
				this.push(null)
				done()
			},
		})
	}

	private async checkForError(): Promise<boolean> {
		return new Promise((resolve) => {
			setTimeout(() => {
				if (this.err.getValue()) resolve(true)
				else resolve(true)
			}, 500)
		})
	}

	private stripANSI(data: Buffer): string {
		let cleanData = data.toString().split("\n")[0]
		cleanData = cleanData.replace(ANSI_REGEX, "")

		return cleanData
	}

	private stderrCB(bufferedData: Buffer): void {
		const data = this.stripANSI(bufferedData)
		this.logger.WithBackground(
			"Debug",
			`The stderr is a error message: ${YARN_ERROR_MSGS.includes(data)}`,
			"debug"
		)
		this.logger.WithBackground("Debug", `Stderr received for the child process: ${data}`, "debug")
		if (YARN_ERROR_MSGS.includes(data)) this.err.setValue(true)
	}
}
