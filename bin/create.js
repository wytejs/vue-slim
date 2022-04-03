const path = require('path')
const fs = require('fs')
const { compileEverything, compileFile } = require('./compiler')

const indexVs = fs.readFileSync(path.join(__dirname, 'templates', 'index.vs'), 'utf8').toString('utf-8')
const mainJs = fs.readFileSync(path.join(__dirname, 'templates', 'main.js'), 'utf8').toString('utf-8')
const mainCss = fs.readFileSync(path.join(__dirname, 'templates', 'main.css'), 'utf8').toString('utf-8')
const mainSass = fs.readFileSync(path.join(__dirname, 'templates', 'main.sass'), 'utf8').toString('utf-8')

const counterVue = fs.readFileSync(path.join(__dirname, 'templates', 'components', 'counter.vue'), 'utf8').toString('utf-8')
const minimalVue = fs.readFileSync(path.join(__dirname, 'templates', 'components', 'Minimal.vue'), 'utf8').toString('utf-8')

async function createProject (folder) {
    if (fs.existsSync(folder)) {
        console.error(cRed(`Folder ${folder} already exists`))
        process.exit(1)
    }
    
    fs.mkdirSync(folder)
    fs.mkdirSync(path.join(folder, 'components'))

    fs.writeFileSync(path.join(folder, 'index.vs'), indexVs)
    fs.writeFileSync(path.join(folder, 'main.js'), mainJs)
    fs.writeFileSync(path.join(folder, 'main.css'), mainCss)
    fs.writeFileSync(path.join(folder, 'main.sass'), mainSass)

    // Components
    fs.writeFileSync(path.join(folder, 'components', 'Counter.vue'), counterVue)

    // What to do next recommendations:
    console.log('----------------------------------------------------------------')
    console.log('Your project has been created!')
    console.log()
    console.log('What to do next:')
    console.log('1. Run "cd ' + folder + '" to switch to your project folder')
    console.log('2. Run "npx vue-slim watch" to watch for changes and compile')
    console.log(`3. Open you browser and navigate to ${path.join(folder, 'dist', 'index.html')}`)
    console.log('4. Start editing your files')
    console.log('----------------------------------------------------------------')
}

module.exports = createProject