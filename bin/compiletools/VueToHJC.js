const scopeCSS = require('./scopeCSS')

// Converts Vue Syntax into an onject with the properties: HTML, CSS, JS

async function VueToHJC (Vue, ComponentName) {
    const out = {
        HTML: '',
        CSS: '',
        JS: '',
        Use: '',
        ComponentName
    }

    // CSS Scope Class
    const cssScopeClass = `vue-slim-component-instance-${ComponentName.replace(/[^a-zA-Z0-9]/g, '-')}`

    // Get everything inside the template tag
    const template = Vue.split('<template>')[1].split('</template>')[0]
    out.HTML = template.trim()
    out.HTML = `<template id="vue-slim-template-for-component-${ComponentName.replace(/[^a-zA-Z0-9]/g, '-')}"><div class="${cssScopeClass}">${out.HTML}</div></template>`

    // Get Everything inside the style tags
    const styles = Vue.split('<style>')
    styles.shift()
    styles.forEach(style => {
        const styleEnd = style.split('</style>')
        styleEnd.pop()
        out.CSS += styleEnd.join('').trim()
    })

    // Get Everything inside the <style scoped> tags
    let scopedCSS = ''

    const scopedStyles = Vue.split('<style scoped>')
    scopedStyles.shift()
    scopedStyles.forEach(scopedStyle => {
        const scopedStyleEnd = scopedStyle.split('</style>')
        scopedStyleEnd.pop()
        scopedCSS += scopedStyleEnd.join('').trim()
    })

    // Add scopes to scoped CSS
    scopedCSS = scopeCSS(scopedCSS, '.' + cssScopeClass)

    // Merge CSS and scoped CSS
    out.CSS += scopedCSS

    // Generate code replacing <Component />
    out.Use = function (props = {}) {
        return `<div v-scope="${ComponentName}(${JSON.stringify(props).replace(/"(.*?)":/g, '$1:').replace(/"/g, '`')})"></div>`
    }

    // Extract JS from first script tag
    const script = Vue.split('<script>').pop().split('</script>')[0]
    out.JS = script.trim()

    // Remove everything out.JS but export default {...}
    let jsBeforeEndGame = ''
    let jsAfterEndGame = ''

    let braces = 0
    let edStartFound = false
    let edEnd = false
    let endGameJS = ''
    for (const line of out.JS.split('\n')) {
        const fL = line.trim()

        if (edEnd) {
            jsAfterEndGame += line + '\n'
            continue
        }

        if (braces > 0) {
            if (fL.includes('}')) {
                braces -= 1

                if (braces === 0) {
                    edEnd = true
                }
            }

            if (fL.includes('{')) braces += 1

            endGameJS += `${line}\n`

            continue
        }

        if (fL.startsWith('export default {')) {
            endGameJS += `{\n`
            braces += 1
            edStartFound = true
        } else {
            if (!edStartFound) {
                jsBeforeEndGame += `${line}\n`
                continue
            }

            if (fL.includes('{')) braces += 1

            endGameJS += line + '\n'
        }
    }

    const endGameJSObj = eval(`(${endGameJS})`)

    if (!endGameJSObj.methods) {
        endGameJSObj.methods = {}
    }

    if (!endGameJSObj.data) {
        endGameJSObj.data = 'data () { return {} }'
    }

    let egmethods = '{'

    for (const [k, v] of Object.entries(endGameJSObj.methods)) {
        egmethods += `${v.toString()},\n`
    }

    egmethods += '}'

    let ejsFunc = `function ${ComponentName} (props) {
    if(!props){props={};}
    ${endGameJSObj.props ? `var gprops = VueSlimJsFilterObjectByKeys(props, ${JSON.stringify(endGameJSObj.props)});` : `var gprops=props;`}
    var methods = ${egmethods}

    var data = ${(endGameJSObj.data.toString().replace(/this/g, 'gprops').replace(/data( *?)\(\)( *?){/, '').trim().replace(/return/g, '').substring(0, endGameJSObj.data.toString().replace(/this/g, 'gprops').replace(/data( *?)\(\)( *?){/, '').trim().replace(/return/g, '').length - 1))}

    return VueSlimJsMergeObjects({
        // Link Template
        $template: '#vue-slim-template-for-component-${ComponentName.replace(/[^a-zA-Z0-9]/g, '-')}'
    }, gprops, methods, data)
}`

    out.JS = `${jsBeforeEndGame}\n${ejsFunc}\n${jsAfterEndGame}`

    return out
}

module.exports = VueToHJC
