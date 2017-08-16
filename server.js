const bodyParser = require('body-parser')
const express = require('express')

const app = express()

app.set('view engine', 'pug')
app.use(bodyParser.json())

app.use('/static', express.static('public'))
app.use(require('./controllers'))

const l = app.listen(3000, () => {
	console.log(`server listening on port ${l.address().port}`)
})
