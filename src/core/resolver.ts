import path from "path"
import glob from "glob"
import isGlob from "is-glob"

import type { Package } from "@manypkg/get-packages"
import type { Dict, ResolverConfig, ResolverType } from "../types"

class BaseResolvers {
	private pkgJSON: Dict<string | Dict<unknown>>
	private packages: Dict<Package>
	private regex: RegExp
	private include: string[]
	private paths: string[]

	constructor(config: ResolverConfig) {
		this.pkgJSON = config.packageJSON
		this.regex = config.regex
		this.paths = []
		this.packages = {}
		this.include = config.include
		this.toObject(config.packages)
	}

	public ExtractDependencies(): string[] {
		if (this.pkgJSON.dependencies)
			this.resolveDependencies(this.pkgJSON.dependencies as Dict<unknown>)
		else if (this.pkgJSON.devDependencies)
			this.resolveDependencies(this.pkgJSON.devDependencies as Dict<unknown>)
		else if (this.pkgJSON.peerDependencies)
			this.resolveDependencies(this.pkgJSON.peerDependencies as Dict<unknown>)

		/* Include cwd into watch listd */
		this.include.forEach((pattern) => {
			const path = process.cwd()
			this.addtoPaths(pattern, path)
		})

		return this.paths
	}

	private resolveDependencies(dependencies: Dict<unknown>): void {
		for (const key in dependencies) {
			const match = key.match(this.regex)
			let name = ""

			if (!match || match.length === 0) continue

			name = match[0].split("/")[1]

			this.include.forEach((pattern) => {
				const path = this.packages[name].dir
				this.addtoPaths(pattern, path)
			})
		}
	}

	private addtoPaths(pattern: string, Path: string): void {
		if (isGlob(pattern)) {
			const files = glob.sync(pattern, { absolute: true, cwd: Path })

			files.forEach((file) => this.paths.push(file))
			return
		}
		this.paths.push(path.join(Path, pattern))
	}

	private toObject(pkgs: Package[]): void {
		pkgs.forEach((pkg) => {
			const name = pkg.dir.split("/").pop() as string
			this.packages[name] = pkg
		})
	}
}

const Resolver: ResolverType = (config) => {
	return new BaseResolvers(config)
}

export default Resolver
