const express = require('express')

const router = new express.Router()

router.get('/', (req, res) => res.render('index'))
router.use('/compile', require('./compile'))
router.use('/docs', require('./docs'))

router.get('*', (req, res) => {
	res.redirect('/')
})

module.exports = router
