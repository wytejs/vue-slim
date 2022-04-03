// <(.*?) (.*?)\/>

async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

function stringToType (str) {
    try {
        return JSON.parse(str)
    } catch {
        return str
    }
}

function parseProps(propsString) {
    propsString = propsString.trim()
    const propsPairs = propsString.split(' ')

    const result = {}

    for (const propsPair of propsPairs) {
        let [key, value] = propsPair.split('=')
        if (value.startsWith('"')) {
            value  = value.substring(1, value.length-1)
        }

        result[key] = stringToType(value)
    }

    return result
}

async function parseHTML (html, ComponentList) {
    // Components in following format: <ComponentName [?props]/> and <ComponentName />
    html = html.replace(/<(.*?) (.*?)\/>/g, function (match, componentName, props) {
        // Check if Component is imported
        if (!ComponentList[componentName]) {
            console.log(`[WARNING] Component ${componentName} is not imported or doesn't exist`)
            return ''
        }

        // Parse Props
        if (props) {
            // <ComponentName [?props]/>
            props = props.trim()
        } else {
            // <ComponentName />
            props = ''
        }

        // Props WhiteSpace Encoding
        props = props.replace(/"(.*?)"/g, function (match, v) {
            return v.replace(/ /g, '___________VUE_SLIM_WHITESPACE_HELPER_678899965083z789___________')
        })

        const propsObject = parseProps(props)

        // Props WhiteSpace Decoding
        for (let [key, value] of Object.entries(propsObject)) {
            if (typeof value === 'string') {
                value = value.replace(/___________VUE_SLIM_WHITESPACE_HELPER_678899965083z789___________/g, ' ')
                propsObject[key] = value
            }
        }

        return ComponentList[componentName].Use(propsObject)
        
    })

    // <Component/>
    html = html.replace(/<(.*?)\/>/g, function (match, componentName) {
        // Check if Component is imported
        if (!ComponentList[componentName]) {
            console.log(`[WARNING] Component ${componentName} is not imported or doesn't exist`)
            return ''
        }

        return ComponentList[componentName].Use({})
        
    })

    return html
}

module.exports = parseHTML