import { existsSync } from "fs"

import type { Package } from "@manypkg/get-packages"
import type { Dict, ResolverConfig, ResolverType } from "../types"

/**
 * @class
 * This class resolves the path to all other packages in a monorepo that is in the package.JSON.
 * NOTE: This only works if a project is a monorepo using lerna, yarn workspaces
 */
class BaseResolvers {
	private pkgJSON: Dict<string | Dict<unknown>>
	private packages: Dict<Package>
	private paths: string[]
	private resolveDep: { dev: boolean; peer: boolean }

	constructor(config: ResolverConfig) {
		this.resolveDep = { dev: config.resolveDevDep, peer: config.resolvePeerDep }
		this.pkgJSON = config.packageJSON
		this.paths = []
		this.packages = {}

		//Convert packages to HASH MAP
		this.toObject(config.packages)
	}

	public ExtractDependencies(): string[] {
		if (this.pkgJSON.dependencies)
			this.resolveDependencies(this.pkgJSON.dependencies as Dict<unknown>)

		if (this.resolveDep.dev && this.pkgJSON.devDependencies)
			this.resolveDependencies(this.pkgJSON.devDependencies as Dict<unknown>)

		if (this.resolveDep.peer && this.pkgJSON.peerDependencies)
			this.resolveDependencies(this.pkgJSON.peerDependencies as Dict<unknown>)

		return this.paths
	}

	private resolveDependencies(dependencies: Dict<unknown>): void {
		for (const key in dependencies) {
			if (this.packages[key] !== undefined) {
				const basePath = this.packages[key].dir
				if (existsSync(`${basePath}/src`)) this.paths.push(`${basePath}/src`)
				else if (existsSync(`${basePath}/source`)) this.paths.push(`${basePath}/source`)
				else if (existsSync(`${basePath}/lib`)) this.paths.push(`${basePath}/lib`)
			}
		}
	}

	private toObject(pkgs: Package[]): void {
		pkgs.forEach((pkg) => {
			this.packages[pkg.packageJson.name] = pkg
		})
	}
}

const Resolver: ResolverType = (config) => {
	return new BaseResolvers(config)
}

export default Resolver
