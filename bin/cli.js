#! /usr/bin/env node

// slice argv as we don't need the forst two elements (in this case)
const args = process.argv.slice(2, process.argv.length)
const path = require('path')
const fs = require('fs')

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
