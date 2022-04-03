#! /usr/bin/env node

// slice argv as we don't need the forst two elements (in this case)
const args = process.argv.slice(2, process.argv.length)
const path = require('path')
const fs = require('fs')
const minify = require('html-minifier').minify
const axios = require('axios')
const sass = require('sass')
const petiteUrl = 'https://unpkg.com/petite-vue'
let petiteCache = false

const getAllFiles = function(rDir, arrayOfFiles = [], dirPath = '', firstIteration = true) {
  files = fs.readdirSync(path.join(rDir, dirPath))

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (fs.statSync(rDir + '/' + dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(rDir, arrayOfFiles, dirPath + "/" + file, false)
    } else {
      arrayOfFiles.push(path.join(dirPath, file))
    }
  })

  return arrayOfFiles.map(r => r.replace(/\\/g, '/'))
}

async function getPetiteVueJS () {
    if (petiteCache) return petiteCache

    petiteCache = (await axios.get(petiteUrl)).data
    return petiteCache
}

// check if the user has provided a command
if (args.length === 0) {
    args.push('help')
}

function cRed (text) {
    return `\x1b[31m${text}\x1b[0m`
}

const command = args[0]

function help () {
    console.log(`
    Usage:
        cli <command> [options]

    Commands:
        help:
            Displays this message

        compile:
            Compiles all .vs file in the current directory

        compilefile [file]:
            Compiles a single .vs file into pure html
    `)
}

// #############################################################################

const slimJs = `
    function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

    function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

    function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

    function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

    function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

    window.createApp=function(options = {}){
        var e=options;
        var vOpts={};
        for (var _i = 0, _Object$entries = Object.entries(e.data()); _i < _Object$entries.length; _i++) {
            var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
                key = _Object$entries$_i[0],
                value = _Object$entries$_i[1];

            vOpts[key] = value;
        }

        var vInstance=PetiteVue.createApp(vOpts);
        return vInstance;
    };
`

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

async function parseScript (script, filePath) {
    const styles = []

    // import x from 'y'
    script = await replaceAsync(script, /import(.*?)from(.*?)($|;)/gm, function (match, variable, modul) {
        variable = variable.trim()
        modul = modul.trim()

        if (modul.startsWith('"') || modul.startsWith("'")) {
            modul = modul.substring(1, modul.length - 1)
        }

        if (modul === 'vue') {
            // Vue functions are already defined, no need to import them
            return ''
        }

        // Other module than vue
        // Check if
    })

    // import 'x'
    script = await replaceAsync(script, /import(.*?)($|;)/gm, async function (match, modul) {
        modul = modul.trim()

        if (modul.startsWith('"') || modul.startsWith("'")) {
            modul = modul.substring(1, modul.length - 1)
        }

        if (modul === 'vue') {
            // Vue functions are already defined, no need to import them
            return ''
        }

        // Other module than vue
        // Check if it is a local file
        if (modul.startsWith('.')) {
            // Local file
            modul = path.join(path.dirname(filePath), modul)
            
            // Check file extension
            if (modul.endsWith('.css')) {
                // CSS
                const cssContent = fs.readFileSync(modul, 'utf8').toString('utf-8')
                styles.push(cssContent)
                return ''
            } else if (modul.endsWith('.sass')) {
                // SASS
                const sassContent = sass.renderSync({
                    file: modul
                })
                styles.push(sassContent.css.toString('utf-8'))
                return ''
            } else if (modul.endsWith('.scss')) {
                // SCSS
                const sassContent = sass.renderSync({
                    file: modul
                })
                styles.push(sassContent.css.toString('utf-8'))
                return ''
            } else if (modul.endsWith('.js')) {
                // JS
                const jsContent = fs.readFileSync(modul, 'utf8').toString('utf-8')
                const mjs = await parseScript(jsContent, modul)
                styles.push(`/*Stylesheets imported from ${filePath} as ${modul}*/${mjs.styles.join('\n')}/* End of import */`)
                return `/* Imported from ${filePath} as ${modul} */${mjs.sscript}/* End of import */`
            } else {
                // Unknown file extension
                console.log(`Unknown file extension for ${modul}`)
                return `console.error("Unknown file extension for ${modul}");`
            }
        }

        // Couldn't handle it
        return match
    })

    const sscript = script

    return { sscript, styles }
}

async function compileFile (filePath) {
    console.time('Successfully compiled file ' + filePath)
    const fileContent = fs.readFileSync(filePath, 'utf8').toString('utf-8')

    // Get petite-vue
    const petiteVue = await getPetiteVueJS()
    
    // Get body
    let body = '<h1>Add a body tag to your .vs file to edit the html</h1>'
    try {
        body = fileContent.split('<body>')[1].split('</body>')[0]
    } catch (e) {}

    // Get head from file
    let _head = ''
    try {
        _head = fileContent.split('<head>')[1].split('</head>')[0]
    } catch (e) {}

    // Get meta[name=language] from file
    let language = ''
    try {
        language = fileContent.split('<meta name="language" content="')[1].split('">')[0]
    } catch (e) {language='en'}

    // Get script from file
    let script = ''
    try {
        script = fileContent.split('<script>')[1].split('</script>')[0]
    } catch (e) {}

    const { sscript, styles } = await parseScript(script, filePath)

    // And merge it with the default head
    const defaultHead = `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">

        <!-- Start Vue-Slim -->
        <style>/*Keeps content hidden until vue is loaded*/[v-scope]{display:none;}</style>
        <!-- @WYTE/INIT -->
        <script>${petiteVue}</script>
        <script>${slimJs}</script>
        <!-- End Vue-Slim -->

        <!-- Custom Script & Styles -->
        <style>${styles.join('')}</style>
        <script>window.addEventListener('DOMContentLoaded',function(){${sscript}});</script>
        <!-- End Custom Script & Styles -->
    `

    const head = `${defaultHead}${_head}`

    let finalHtml = `<!DOCTYPE html><html lang="${language}"><head>${head}</head><body>${body}</body></html>`

    // Convert filePath into an special array
    const filePathArray = filePath.split(path.sep)
    const beforeName = filePathArray.slice(0, filePathArray.length - 1).join(path.sep)
    const fileName = filePathArray[filePathArray.length - 1]
    const distPath = path.join(beforeName, 'dist', fileName.replace(/\.vs/g, '.html'))

    if (!fs.existsSync(path.join(beforeName, 'dist'))) {
        fs.mkdirSync(path.join(beforeName, 'dist'))
    }

    // Minify html
    finalHtml = minify(finalHtml, {
        caseSensitive: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
    })

    fs.writeFileSync(distPath, finalHtml)
    console.timeEnd('Successfully compiled file ' + filePath)
}

async function compileEverything (folder = process.cwd()) {
    const files = getAllFiles(folder).map(x => x.endsWith('.vs') ? x : null).filter(x => x)
    for (let i = 0; i < files.length; i++) {
        await compileFile(files[i])
    }
}

// #############################################################################

let wTo = {}

if (command == 'help') {
    help()
} else if (command == 'compilefile') {
    let file = args[1]
    if (file) {
        if (!path.isAbsolute(file)) file = path.join(process.cwd(), file)
        
        // file must exist
        if (!fs.existsSync(file)) {
            console.error(cRed(`File ${file} does not exist`))
            process.exit(1)
        }

        // file must be a .vs file
        if (!file.endsWith('.vs')) {
            console.error(cRed(`File ${file} is not a .vs file`))
            process.exit(1)
        }

        compileFile(file)
    } else {
        console.log(cRed(`Please provide a file to compile`))
        process.exit(1)
    }
} else if (command === 'compile') {
    compileEverything()
} else if (command === 'watch') {
    compileEverything().then(_ => {
        console.log('Watching for changes...')
        fs.watch(process.cwd(), { recursive: true }, (eventType, filename) => {
            if (filename.endsWith('.vs')) {
                if (wTo[filename]) {
                    
                } else {
                    wTo[filename] = setTimeout(() => { compileFile(filename); wTo[filename] = undefined }, 1000)
                }
            }
        })
    })
} else {
    console.log(cRed(`Invalid command: ${command}`))
    help()
}
