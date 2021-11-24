#! /usr/bin/env node
import { getPackagesSync } from "@manypkg/get-packages"

import Resolver from "./core/resolver"
import Watcher from "./core/watcher"
import { Config, argv, MergeNormalizeConfig, Logger } from "./helpers"

import type { Dict } from "./types"

const logger = Logger.getInstance()

const { root, packages } = getPackagesSync(Config.packageRoot || process.cwd())
const config = MergeNormalizeConfig(Config, packages, argv)

/* 
  Resolve caller package's package.json
*/
let packageJSON
packages.map((pkg) => {
	if (pkg.dir === config.packageRoot) packageJSON = pkg.packageJson
	return
})

if (packageJSON === undefined)
	// process.exit will be called packageJSON is undefined
	logger.LogError(`Could not find package.json in ${config.packageRoot}`)

const resolve = Resolver({
	resolveDevDep: config.resolveDevDependencies,
	resolvePeerDep: config.resolvePeerDependencies,
	packageJSON: packageJSON as unknown as Dict<string, string>,
	packages,
})

/* 
Watch Files
*/
const include = [...resolve.ExtractDependencies(), ...config.include]

Watcher({
	root: root.dir,
	include,
	packages,
	config,
})
