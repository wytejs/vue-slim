const path = require('path')
const fs = require('fs')
const minify = require('html-minifier').minify
const axios = require('axios')
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

function cRed (text) {
    return `\x1b[31m${text}\x1b[0m`
}

const parseScript = require('./compiletools/parseScript')

const slimJs = `
    function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

    function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

    function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

    function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

    function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

    function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

    function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

    function VueSlimJsMergeObjects() {
        for (var _len = arguments.length, objects = new Array(_len), _key = 0; _key < _len; _key++) {
            objects[_key] = arguments[_key];
        }

        return objects.reduce(function (acc, obj) {
            Object.keys(obj).forEach(function (key) {
            acc[key] = obj[key];
            });
            return acc;
        }, {});
    }

    function VueSlimJsFilterObjectByKeys(obj, keys) {
        var newObj = {};

        var _iterator = _createForOfIteratorHelper(keys),
            _step;

        try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var key = _step.value;
            newObj[key] = obj[key];
            }
        } catch (err) {
            _iterator.e(err);
        } finally {
            _iterator.f();
        }

        return newObj;
    }

    window.VueSlimJsMergeObjects = VueSlimJsMergeObjects;
    window.VueSlimJsFilterObjectByKeys = VueSlimJsFilterObjectByKeys;

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

    // Parse script
    const { sscript, styles, thtml, instantjs } = await parseScript(script, filePath)

    // Parse html (templates)
    let templateHTMLLiteral = ''
    templateHTMLLiteral += thtml

    // And merge it with the default head
    const defaultHead = `
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">

        <!-- Start Vue-Slim -->
        <style>/*Keeps content hidden until vue is loaded*/[v-scope]{display:none;}template{display:none;}</style>
        <!-- @WYTE/INIT -->
        <script>${petiteVue}</script>
        <script>${slimJs}</script>
        <!-- End Vue-Slim -->

        <!-- Custom Script & Styles -->
        <style>${styles.join('')}</style>
        <script>${instantjs};window.addEventListener('DOMContentLoaded',function(){${sscript}});</script>
        <!-- End Custom Script & Styles -->
    `

    const head = `${defaultHead}${_head}`

    let finalHtml = `<!DOCTYPE html><html lang="${language}"><head>${head}</head><body>${templateHTMLLiteral}\n\n${body}</body></html>`

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

module.exports = { compileEverything, compileFile }