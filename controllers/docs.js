const path = require('path')
const fs = require('fs')

const express = require('express')
const pify = require('pify')

const router = new express.Router()

const guidesPath = path.resolve(__dirname, '../views/docs/guide')

const guidePages = {
	async getAll() {
		if (this.cache) {
			return this.cache
		}

		const filenames = await pify(fs.readdir)(path.join(guidesPath))
		const guides = filenames.map(filename => {
			const name = filename.slice('00-'.length).slice(0, -('.pug').length)

			return {
				filepath: path.join(guidesPath, filename),
				github: 'https://github.com/nikersify/fig-web/blob/master/' +
					`views/docs/guide/${filename}`,
				name,
				title: (n => {
					n = n.charAt(0).toUpperCase() + n.slice(1)
					return n.replace(/-/g, ' ')
				})(name),
				url: `/docs/guide/${name}`
			}
		})

		this.cache = guides
		return guides
	}
}

router.get('/', async (req, res) => {
	res.redirect('/docs/guide')
})

router.get('/api', async (req, res) => {
	const guides = await guidePages.getAll()
	res.render('docs/api', {
		currentGuide: {
			github: 'https://github.com/nikersify/fig-web/' +
				'blob/master/views/docs/api'
		},
		guides,
		isApi: true
	})
})

router.get('/guide', async (req, res) => {
	const pages = await guidePages.getAll()
	res.redirect(`/docs/guide/${pages[0].name}`)
})

router.get('/guide/:name', async (req, res, next) => {
	const {name} = req.params
	const guides = await guidePages.getAll()

	for (const guide of guides) {
		if (guide.name === name) {
			const index = guides.indexOf(guide)
			return res.render(guide.filepath, {
				navPrev: guides[index - 1],
				navNext: guides[index + 1],
				currentGuide: guide,
				guides
			})
		}
	}

	next()
})

module.exports = router
