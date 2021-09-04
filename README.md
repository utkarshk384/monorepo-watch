# Monorepo Watch

NOTE: This is a work in progress. Currently it's in its alpha state.
Any suggestions are warmly welcomed 😄.
<br/>
<br />
A asynchronous, customizable file watcher for projects using lerna, yarn workspaces, and monorepos.

<br/>
<br/>

## Recommended Usage
It is recommended to use a terminal that has a at least level=2 support for colors([256 color support](https://nodejs.org/api/tty.html#tty_readstream_setrawmode_mode))

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


module.exports = {
    /**
     * @default {process.cwd()}
     * The root of the current pacakge.
    */
    root: string,

    /**
     * @default {`name` Field taken from `package.json`}
     * The scoped package name.
     * Eg: @mypackage/pkg1, the prefix here is `@mypackge`
    */
    prefix: string,

    /**
     * @default {["src"]}
     * The directories to be watched inside the package folder.
     * Globbing supported
    */
    include: string[],

    /**
     * @default {{}}
     * Options that is directly passed to the `chokidar.watch` method.
     * Please refer to the https://github.com/paulmillr/chokidar#api to see all the available options
    */
    options: chokidar.WatchOptions,

    /**
     * @type {{
     *  add: (path: string, stats: fs.Stats) => any
     *  addDir: (path: string, stats: fs.Stats) => any
     *  change: (path: string, stats: fs.Stats) => any
     *  unlink: (path: string) => any
     *  unlinkDir: (path: string) => any
     * }}
     * @required
     * This is the action that is to be performed when different events occur.
    */
    actions: EventActionWatchActions,
}
```
