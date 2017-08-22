const {Readable} = require('stream')

const browserify = require('browserify')
const figify = require('figify')
const log = require('@nikersify/log')

module.exports = () => {
	return (req, res) => {
		log.trace('compiler', `compiling bundle for ${req.ip}`)

		const paths = req.body
		const b = browserify({ignoreMissing: true})

		b.transform(figify)

		Object.keys(paths).map(fileName => {
			const code = paths[fileName]
			const stream = new Readable()

			stream.push(code)
			stream.push(null)
			stream.file = fileName

			return {stream, fileName}
		}).forEach(entry => {
			b.add(entry.stream, {expose: entry.fileName})
		})

		b.bundle((err, buf) => {
			if (res.headersSent) {
				return
			}

			if (err) {
				res.status(400).send({
					success: false,
					error: err.toString()
				})
			} else {
				res.send({
					success: true,
					result: buf.toString()
				})
			}
		})
	}
}
