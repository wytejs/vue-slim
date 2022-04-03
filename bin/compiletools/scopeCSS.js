function scopeCSS (css, prefix) {
    // This function will replace all the CSS selectors with the prefix + the CSS Selector
    // e.g. .my-class {...} => prefix .my-class {...}

    // Replace all the CSS selectors with the prefix + the CSS Selector
    css = css.replace(/([^\s]*)\s*{/g, (match, selector) => {
        // Add the prefix to the selector
        selector = prefix + ' ' + selector

        // Add the last character of the selector
        selector = selector + ' {'

        return selector
    })

    return css
}

module.exports = scopeCSS