const path = require('path')
const fs = require('fs')
const sass = require('sass')

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

module.exports = parseScript