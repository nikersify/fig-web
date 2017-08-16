/* eslint-env browser */

const fig = require('figjs')
const stripAnsi = require('strip-ansi')

const util = require('./util')
const EditorComponent = require('./components/Editor.fig')
const TabComponent = require('./components/Tab.fig')

module.exports = (root, files) => {
	const app = fig()

	app.use(EditorComponent)
	app.use(TabComponent)

	let editor = null
	const docs = []

	app.state = {
		errorMsg: null,
		loading: false,
		overlay: null,
		pendingChanges: false,
		tabs: []
	}

	app.on('fig ready', () => {
		editor = util.cm(app.ref.code)

		editor.on('change', () => {
			app.emit('code changes', true)
		})

		editor.setOption('extraKeys', {
			'Ctrl-Enter': () => {
				app.emit('code run')
			}
		})

		for (const file of files) {
			app.emit('tab new', {
				name: file.name,
				value: file.value
			})
		}

		app.emit('tab select', app.state.tabs[0].id)
		app.emit('code run')
	})

	app.on('tab select', id => {
		let t = null
		for (const tab of app.state.tabs) {
			if (tab.id === id) {
				tab.selected = true
				t = tab
			} else {
				tab.selected = false
			}
		}

		editor.swapDoc(docs[id])

		const syntax = util.getSyntax(t.name)
		editor.setOption('mode', syntax)

		docs[id].getEditor().focus()
	})

	app.on('tab new', (opts = {}) => {
		const id = util.id()

		app.state.tabs.push({
			name: opts.name || '',
			id,
			editing: !opts.name,
			selected: false
		})

		docs[id] = util.doc(opts.value)

		if (opts.name) {
			app.emit('tab edit confirm', {
				id,
				value: opts.name
			})
		} else {
			app.emit('tab edit', id)
		}

		app.emit('code changes')
	})

	app.on('tab remove', id => {
		const index = app.state.tabs.findIndex(tab => tab.id === id)
		app.state.tabs.splice(index, 1)

		delete docs[id]

		if (app.state.tabs.length > 0) {
			app.emit('tab select', app.state.tabs[0].id)
		}

		app.emit('code changes')
	})

	app.on('tab edit', id => {
		for (const tab of app.state.tabs) {
			if (tab.id === id) {
				tab.editing = true
			}
		}

		const $input = document.querySelector(`#tab-input-${id}`)
		$input.select()
	})

	app.on('tab edit confirm', payload => {
		let unique = true
		for (const tab of app.state.tabs) {
			if (tab.name === payload.value) {
				unique = false
				break
			}
		}

		for (const tab of app.state.tabs) {
			if (tab.id === payload.id) {
				if (unique) {
					tab.name = payload.value
				}

				tab.editing = false

				if (tab.name.length === 0) {
					app.emit('tab remove', payload.id)
					return
				}

				break
			}
		}

		app.emit('code changes', true)
		app.emit('tab select', payload.id)
	})

	app.on('code changes', (pending = true) => {
		if (app.state.pendingChanges !== pending) {
			app.state.pendingChanges = !app.state.pendingChanges
		}
	})

	app.on('code run', () => {
		if (app.state.loading) {
			return
		}

		app.emit('code changes', false)

		app.state.loading = true
		app.state.overlay = 'loading'

		const files = {}
		for (const tab of app.state.tabs) {
			const syntax = util.getSyntax(tab.name)
			if (['pug', 'javascript'].indexOf(syntax) !== -1) {
				files['./' + tab.name] = docs[tab.id].getValue()
			}
		}

		util.post('/compile', files).then(compiled => {
			app.state.loading = false
			app.state.overlay = null

			const html = (() => {
				for (const tab of app.state.tabs) {
					if (tab.name === 'index.html') {
						return docs[tab.id].getValue()
					}
				}
			})()
			util.updateIFrame(app.ref.result, html, compiled)
		}).catch(err => {
			if (err.annotated) {
				app.state.errorMsg = err.annotated
			} else if (err.codeFrame) {
				const location = err.filename + '\n'
				app.state.errorMsg = location +
					stripAnsi(err.codeFrame)
			} else {
				app.state.errorMsg = err.toString()
			}

			app.state.overlay = 'error'
		}).then(() => {
			app.state.loading = false
		})
	})

	app.mount(root, 'code-editor')
}
