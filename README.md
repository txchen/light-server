# light-server

A lightweight cli static http server and it can watch files, execute commands and trigger livereload.

## Why light-server?

When I was writing some simple static web apps, it was helpful to have some tools to serve static http, to watch files and run command, and to trigger refresh in browser.

I think the scenario is not too complicated, so I don't want to use heavy tools like grunt or gulp. IMO, npm script with cli tools is already enough.

Here is an [article](http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/) about using npm to replace grunt/gulp, I really like it.

There are many existing tools in npm, but I could not find one to do all the things for me. Well, actually browser-sync is one, but it offers too many features I don't need, and its installation time is really, unacceptable.

Not lucky enough :(

Then I wrote light-server, with the following features:
* A simple static http server
* Watch files, support multiple glob expressions
* Trigger custom command if watched files change
* Trigger browser reload if watched files change
* Auto inject client reload javascript in html, no need to manually add
* Live reload websocket server uses the same port as http server

And now my package.json is simpler and cleaner than before :)

## Install

light-server has much smaller footprint, compared to browser-sync, so it is recommended to install in project level, and use it with npm script.

```bash
$ npm install light-server
```
Of course, you can install it globally, too.

## Usage

```
Usage: light-server [options]

Options:

  -h, --help                      output usage information
  -V, --version                   output the version number
  -s, --serve <directory>         serve the directory as static http
  -p, --port <port>               http server port, default 4000
  -w, --watch <files to watch>    files to watch, in glob format, repeatable
  -c, --cmd <command>             if watched files changed, trigger the command
  -i, --interval <watch inteval>  interval in ms of watching, default 500
  -d, --delay <livereolad delay>  delay in ms before triggering live reload, default 0

Examples:

  $ light-server -s . -p 7000
  $ light-server -s . -w "*.js" -w "src/**" -c "npm run build && echo wao!"
```

It is quite simple, specify the folder to serve as static http, specify the files to watch, specify the command to run when watched files change, and light-server will do the job.

**You don't need to add reload script into your html, light-server will inject it automatically.**

You don't need to use all the features, and that's totally ok:

* You can serve http without watching files.
* You can serve http and enable live-reload, without triggering command.
* You can watch files and trigger command, without serving http. This makes light-server work like `nodemon`, but it is better than that.

## Manual trigger live-reload

Get or POST `http://localhost:PORT/__lightserver__/trigger`, light-server will send reload command to the browser.

It means that it's possible to integrate other tools with light-server.

## Example

Let's take a look at a real example. [Riot-Hackernews](https://github.com/txchen/riot-hn) is static web app powered by riotjs. This is its package.json:

```json
{
  "devDependencies": {
    "browserify": "^8.1.3",
    "light-server": "^0.1.2",
    "minifyify": "^6.2.0",
    "riotify": "^0.0.9"
  },
  "scripts": {
    "build": "npm run build:js && npm run build:css",
    "build:js": "browserify -t [riotify --ext html] -d src/index.js -p [minifyify --compressPath . --map index.js.map --output build/index.js.map] -o build/index.js",
    "build:css": "cp src/main.css build/main.css",
    "dev": "light-server -s . -p 9090 -w 'src/**' -c 'npm run build'"
  },
  "dependencies": {
    "riot": "^2.0.11"
  }
}
```

The project uses browserify and plugins to bundle the source code into a single bundle.js, it is not using css pre/post processors but for sure it could.

The build process is defined in script `build`, which is quite straightforward.

During development, we can use `npm run dev`, which will use light-server to serve the static content, and watch the changes of any files under `src` directory. When it detects file change, it would trigger build and if build pass, browser will auto reload.

Of course, you can also achieve that by using grunt or gulp, with more dependencies and more LOC.

## Changelog

**2015-03-02** `0.1.3`
Add delay option

**2015-02-28** `0.1.1`
First version.
