#! /usr/bin/env node

// slice argv as we don't need the forst two elements (in this case)
const args = process.argv.slice(2, process.argv.length)
const path = require('path')
const fs = require('fs')
const readline = require("readline-sync")
const createProject = require('./create')

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

// check if the user has provided a command
if (args.length === 0) {
    args.push('help')
}

function cRed (text) {
    return `\x1b[31m${text}\x1b[0m`
}

function cGreen (text) {
    return `\x1b[32m${text}\x1b[0m`
}

function cYellow (text) {
    return `\x1b[33m${text}\x1b[0m`
}

function cCyan (text) {
    return `\x1b[36m${text}\x1b[0m`
}

const command = args[0]

function help () {
    console.log(`
    Usage:
        cli <command> [options]

    Commands:
        help:
            Displays this message

        compile [--no-minify]:
            Compiles all .vs file in the current directory

        compilefile [file]:
            Compiles a single .vs file into pure html
        watch:
            Watches for changes in the current directory and compiles all .vs files
        create:
            Guides the user through creating a new vue-slim project
        create-component [name]:
            Creates a new component with the given name
    `)
}

const { compileEverything, compileFile } = require('./compiler')

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
    compileEverything(process.cwd(), args[1] !== '--no-minify')
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
} else if (command === 'create') {
    const folder = path.join(process.cwd(), readline.question('Enter the name of the project: ').toLowerCase())
    
    createProject(folder)
} else if (command === 'create-component') {
    const componentName = args[1]
    if (!componentName) {
        console.log(cRed(`Please provide a component name`))
        process.exit(1)
    }

    const MinimalComponent = fs.readFileSync(path.join(__dirname, 'templates', 'components', 'Minimal.vue')).toString('utf-8')

    fs.writeFileSync(path.join(process.cwd(), 'components', componentName + '.vue'), MinimalComponent)

    console.log('Component created!')
    console.log()
    console.log('Please add the following to your index.vs file in the script tag:')
    console.log(cCyan('import ' + componentName + ' from \'./components/' + componentName + '.vue\''))
    console.log()
    console.log('And then add the following code to your template:')
    console.log(cCyan('<' + componentName + '/>'))
    console.log()
    console.log('And add ' + cCyan(componentName) + ' to your "components: {...}" option in createApp()')
    console.log()
    console.log()
    console.log('Now you can start coding!')

} else {
    console.log(cRed(`Invalid command: ${command}`))
    help()
}
