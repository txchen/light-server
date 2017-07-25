## Features

- Re-render html on file changes
- Reload Javascript on file changes
- Reload CSS on file changes (without page refresh)

## What´s inside?

- `pug` templates (renamed from `jade`): https://github.com/pugjs/pug
- `stylus` css: http://stylus-lang.com/
- `browserify` for bundling: http://browserify.org/
- `babel` (babelify) & `es2015 preset` for transpiling: https://babeljs.io/
- `light-server` for serving the static files

## Installation

```sh
npm install
npm start
```

Visit: http://localhost:8000

### Directories

`src/` contains the unprocessed files split up in `styles`, `templates`, `scripts` and `images`.

`build/` contains the process files which will be served.

If you add new files - especially images - you may want to restart the server, as the file watcher might not work correctly.

### Source

This boilerplate project is also available separately:
https://github.com/Scarysize/pug-stylus-es5-boilerplate
