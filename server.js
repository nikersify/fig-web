const fs = require('fs')

const bodyParser = require('body-parser')
const express = require('express')
const log = require('@nikersify/log')

if (!fs.existsSync('config.json')) {
	log.fatal('app', `copy ${log.e('config.example.json')} ` +
		`to ${log.e('config.json')} before running the app`)

	throw new Error('couldn\'t read config file')
}

const config = require('./config')

log.success('app', `read ${log.e('config.json')}`)

const app = express()

app.set('view engine', 'pug')
app.use(bodyParser.json())

app.use('/static', express.static('public'))
app.use(require('./controllers'))

const l = app.listen(config.http.port, () => {
	log.success('http', 'server started')
	log.info('http', `server listening on port ${log.e(l.address().port)}`)
})
