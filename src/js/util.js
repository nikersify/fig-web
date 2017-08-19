/* eslint-env browser */
/* eslint-disable import/no-unassigned-import */

require('codemirror/mode/css/css')
require('codemirror/mode/htmlmixed/htmlmixed')
require('codemirror/mode/javascript/javascript')
require('codemirror/mode/pug/pug')

require('codemirror/addon/edit/closebrackets')
require('codemirror/addon/edit/matchbrackets')
require('codemirror/addon/scroll/simplescrollbars')

const codeMirror = require('codemirror')

module.exports = {
	id: () => Math.random().toString(36).slice(2, 8),
	cm: $el => codeMirror($el, {
		autoCloseBrackets: true,
		cursorHeight: 1,
		indentUnit: 4,
		indentWithTabs: true,
		lineNumbers: true,
		lineWrapping: true,
		matchBrackets: true,
		scrollbarStyle: 'overlay',
		tabSize: 4,
		theme: 'dracula'
	}),
	doc: value => new codeMirror.Doc(value || ''),
	getSyntax: name => {
		const dotIndex = name.lastIndexOf('.')
		if (dotIndex === -1) {
			return null
		}

		const ext = name.slice(dotIndex)

		const modes = {
			'.fig': 'pug',
			'.html': 'htmlmixed',
			'.js': 'javascript',
			'.pug': 'pug'
		}

		if (modes[ext]) {
			return modes[ext]
		}

		return null
	},
	post: (url, body) => {
		body = JSON.stringify(body)

		const init = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body
		}

		return fetch(url, init).then(res => {
			if (res.status === 400) {
				return res.text().then(text => {
					return Promise.reject(JSON.parse(text))
				})
			} else if (res.ok) {
				return res.text()
			}

			throw res
		})
	},
	updateIFrame: ($container, html, script) => {
		if (!html) {
			html = '<div id=\'app\'></div>'
		}

		// Clear old iframes
		if ($container.children.length !== 0) {
			$container.querySelector('iframe').remove()
		}

		const $iframe = document.createElement('iframe')

		$container.appendChild($iframe)
		$iframe.contentWindow.document.open()
		$iframe.contentWindow.document.write(html)
		$iframe.contentWindow.document.close()

		// Main bundle
		const $script = $iframe.contentDocument.createElement('script')
		$script.innerHTML = script
		$iframe.contentDocument.head.appendChild($script)
	}
}
