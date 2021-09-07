# Monorepo Watch

NOTE: This is a work in progress. Currently it's in its beta state.
Any suggestions are warmly welcomed 😄.
<br/>
<br />
A asynchronous, customizable file watcher for projects using lerna, yarn workspaces, and monorepos.

<br/>
<br/>

## Recommended Usage
It is recommended to use terminals that has a at least level=2 support for colors([256 color support](https://nodejs.org/api/tty.html#tty_readstream_setrawmode_mode))

Terminals that support colors are:

1. [Gitbash](https://git-scm.com/download/win)
2. [Windows Terminal](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701#activetab=pivot:overviewtab)
3. [zsh](https://ohmyz.sh/#install)
4. [bash](https://www.gnu.org/software/bash/)

## Installation

```sh
npm install --save monorepo-watch
```

or

```sh
yarn add monorepo-watch
```

<br/>
<br/>

## Usage

1. Create a config file in the root of the project directory.
   </br>
   Eg:

```
packages
├── pkg1
│   ├── src
│   └── package.json
└── pkg2
    ├── src
    └── package.json
package.json
lerna.json
watcher.config.js <--root
```

See [configuration](https://https://github.com/Utkarshk384/monorepo-watch#Configuration) section below on how to configure your watcher.

2. Now run the follow command from any of your packages to get the watcher running.
   <br/>
   As a example, I am running the command from `packages/pkg1`

```sh
npm run watcher -c ../../watcher.config.js -i src
```

The `-c` flag is the config file path and `-i` is the dirs to include.
For multiple dirs use `-i={"src","lib", etc...}`

<br />

This will watch the `src` directory and resolve all it's dependencies and watch its `src` directory as well.

<br/>
<br/>

## Configuration

NOTE: Only [CommonJS](https://medium.com/@cgcrutch18/commonjs-what-why-and-how-64ed9f31aa46) is supported for the config file

```typescript
//watcher.config.js


/**
 * Include types for ease of use
 * @type {import('monorepo-watch/dist/types/types').IConfig}
 */

module.exports = {
    /**
     * @required
     * @default process.cwd()
     * 
     * The root of the current pacakge.
    */
    packageRoot: string,

    /**
     * @optional
     * @default {`name` Field taken from one of the `package.json` 
     * from the packages}
     * 
     * The scoped package name.
     * Eg: @mypackage/pkg1, the prefix here is `@mypackge`
    */
    prefix: string,

    /**
     * @optional
     * @default ["src"]
     * 
     * The directories to be watched inside the package folder.
     * 
     * Globbing supported
    */
    include: string[],

    /**
     * @optional
     * @default {}
     * 
     * Options that is directly passed to the `chokidar.watch` method.
     * Please refer to the https://github.com/paulmillr/chokidar#api
     * to see all the available options
    */
    options: chokidar.WatchOptions,

    /**
     * @optional
     * @type {
     *  add: (path: string, stats: fs.Stats) => any
     *  addDir: (path: string, stats: fs.Stats) => any
     *  change: (path: string, stats: fs.Stats) => any
     *  unlink: (path: string) => any
     *  unlinkDir: (path: string) => any
     * }
     * 
     * This is the action that is to be performed when different events 
     * occur.
    */
    actions: EventActionWatchActions,

    /**
     * @optional
     * @default []
     * 
     * A command that will be ran on all file event changes.
     * 
     */
    runScripts: string | string[],

    /**
     * @optional
     * @default true
     * 
     * If true, the watcher will resolve dev dependencies and watch
     * those as well. 
     * 
     * Note: The watcher will only resolve dependencies that are within
     *       the package. It won't resolve any node_modules.
     */
    resolveDevDependencies: boolean,
    
    /**
     * @optional
     * @default true
     * 
     * If true, the watcher will resolve peer dependencies and watch
     * those as well. 
     * 
     * Note: The watcher will only resolve dependencies that are within
     *       the package. It won't resolve any node_modules.
     */
    resolvePeerDependencies: boolean,

    /**
     * @optional
     * @default true
     * 
     * If true, the watcher will not pipe any logs to process.stdout 
     * and set the stdio to "ignore". Only applicable for situations  
     * where `runScripts` is defined.
     * 
     */
    noChildProcessLogs: boolean,

}
```
