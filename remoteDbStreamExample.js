#!/usr/bin/env node

const net = require('net')
const level = require('level')
const ost = require('object-stream-tools')
const _ = require('lodash')

const db = level(__dirname + '/testDb', { valueEncoding: 'json' })

db.put('tools', [
    'hammock',
    'hemoroids',
    'hub',
    'brick'
])

db.put('cities', [
    'Zürich',
    'Geneva',
    'Basel',
    'Lausanne',
    'Bern',
    'Winterthur',
    'Lucerne',
    'St. Gallen'
])

db.put('names', [
    'Lucas',
    'Marc',
    'Anthony',
])

// TODO search of props of each object
const countries = require('./countries.js').map(({ name }) => name)
db.put('countries', countries)

const getQuery = buffer =>
    JSON.parse(buffer.toString())
        .query
        .toLocaleLowerCase()

const server = net.createServer(socket =>
    socket.on('data', buffer =>
        // start: query, end: query + '\xff'
        db.createReadStream({ keys: false, values: true })
            .pipe(ost.map(labels =>
                labels
                    .map(_.toLower)
                    .filter(e => e.includes(getQuery(buffer)))))
            .pipe(ost.reduce((acc, curr) =>
                acc.concat(curr)))
            .pipe(ost.map(JSON.stringify))
            .pipe(socket)))

server.listen(1337, '0.0.0.0')


const client = new net.Socket()

client.connect(1337, '127.0.0.1', () =>
    client.write(JSON.stringify({
        query: 'to'
    })))

// could client.destroy()
client.on('data', data =>
    console.log('Received: ' + JSON.parse(data)))