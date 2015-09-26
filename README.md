babel-autonode
--------------

Automatically and transparently use as little babel as possible with
whatever version of node is in use.

### Installing with a global helper:

```
npm install -g babel-autonode-init
```

And in a new project:

```
babel-autonode-init
```

### THE BIG ASSUMPTION

WARNING WARNING WARNING

We only make one big assumption and that's that you keep your project js
files in `src/`.  Now, I don't ordinarily do that, but it makes the
integration work this module has to do MUCH easier.  I would _love_ a patch
that made it not care, but I'm probably not going to be motivated to write
it myself.

### FRONTEND

The way the loader works is node specific and not appropriate for the
frontend.  I would be open to patches to make this more frontend friendly.

### Installing by hand:

The above is the equivalent of:
```
npm install --save-dev babel babel-autonode
```
and then adding this to your `package.json` file:
```
"scripts": {
  "build": "babel-autonode",
  "prestart": "npm run build",
  "prepublish": "npm run build"
},
```

And the final bit it does is a little more complicated.  It creates a file
named `loader.js`, which is just:

```
module.exports = require('babel-autonode/loader.js')
```

And then it patches your `package.json` copying the `main` field (the entry
point for your module, which defaults to `index.js`) to
`babel-autonode.main` and sets `main` to `loader.js`

### Using:

Any time you run `npm install` (with no arguments), `npm pack` or `npm
publish` then `babel-autonode` will be called to refresh your compiles.
Don't worry though, it should be _very_ fast if nothing has changed.

If you want to manually do a build, run `npm

### babel-autonode

The `babel-autonode` expects to be run from your module root (where your
`package.json` is) and scans your `src` folder for files that have changed
since it was last run.  Any changed files are recompiled with babel into
each version supported by autonode.  Compile targets look like:

```
v8/#.#.#.#/filename.js
````

The provided `loader.js`, will load your entry point from the appropriate v8 folder
for you automatically.

### What's missing?

Probably a lot of documentation on using this thing, but I wanted to get it
out there!
