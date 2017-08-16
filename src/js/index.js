/* eslint-env browser */
const makeEditor = require('./editor')

const examples = document.querySelectorAll('.__example')

for (const example of examples) {
	const files = []
	for (const file of example.querySelectorAll('.file')) {
		const name = file.querySelector('.name').innerHTML
		const value = file.querySelector('script').innerHTML

		files.push({name, value})
	}

	makeEditor(example, files)
}
