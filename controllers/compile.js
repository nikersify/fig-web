const express = require('express')
const compiler = require('../lib/compiler')

const router = new express.Router()

router.post('/', compiler())

module.exports = router
