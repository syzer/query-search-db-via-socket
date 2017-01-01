// based on https://github.com/fergiemcdowall/search-index/blob/master/doc/quickstart.md

const split = require('split2')
const ost = require('object-stream-tools')
const chalk = require('chalk')
const request = require('request')
const tc = require('term-cluster')
const _ = require('lodash')

const url = 'https://raw.githubusercontent.com/fergiemcdowall/reuters-21578-json/master/data/fullFileStream/justTen.str'

const noop = () => {}

const indexData = (err, newIndex) =>
    request(url)
        .pipe(split())
        .pipe(ost.map(JSON.parse))
        .pipe(newIndex.defaultPipeline())
        .pipe(newIndex.add())
        .on('data', noop)
        .on('end', searchCLI(newIndex))

const printPrompt = () =>
    process.stdout.write(chalk.green('search > '))

const searchCLI = index => () => {
    printPrompt()
    process.stdin.resume()
    process.stdin.on('data', search(index))
}

const search = index => rawQuery =>
    index.search(rawQuery.toString().replace(/\r?\n|\r/g, ''))
        .on('data', printResults)
        .on('end', printPrompt)

const printResults = data => {
    console.log(`${chalk.blue(data.document.id)} : ${chalk.blue(data.document.title)}`)
    const terms = Object.keys(data.scoringCriteria[0].df)
        .map(item => item.substring(2))

    _.forIn(data.document, v => {
        const teaser = tc(v, terms)
        if (teaser) console.log(teaser)
    })
}

require('search-index')({
    indexPath: 'myCoolIndex',
    logLevel: 'error'
}, indexData)