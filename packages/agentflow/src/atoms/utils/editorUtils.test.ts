import { getEditorMarkdown, isHtmlContent } from '../../atoms/utils/editorUtils'

describe('editorUtils', () => {
    // isHtmlContent — Falsy / non-string inputs
    it('isHtmlContent returns false for empty string', () => {
        expect(isHtmlContent('')).toBe(false)
    })

    it('isHtmlContent returns false for null', () => {
        expect(isHtmlContent(null)).toBe(false)
    })

    it('isHtmlContent returns false for undefined', () => {
        expect(isHtmlContent(undefined)).toBe(false)
    })

    it('isHtmlContent returns false for a number', () => {
        expect(isHtmlContent(42)).toBe(false)
    })

    // isHtmlContent — Markdown content (must NOT be detected as HTML)
    it('isHtmlContent returns false for plain text', () => {
        expect(isHtmlContent('You are a helpful assistant.')).toBe(false)
    })

    it('isHtmlContent returns false for markdown heading', () => {
        expect(isHtmlContent('## My heading')).toBe(false)
    })

    it('isHtmlContent returns false for markdown bullet list', () => {
        expect(isHtmlContent('- item 1\n- item 2')).toBe(false)
    })

    it('isHtmlContent returns false for markdown with variable syntax', () => {
        expect(isHtmlContent('Hello {{question}}, today is {{current_date_time}}')).toBe(false)
    })

    it('isHtmlContent returns false for markdown code fence', () => {
        expect(isHtmlContent('```js\nconsole.log("hello")\n```')).toBe(false)
    })

    it('isHtmlContent returns false for markdown bold/italic', () => {
        expect(isHtmlContent('**bold** and *italic* text')).toBe(false)
    })

    // isHtmlContent — Legacy HTML content (MUST be detected)
    it('isHtmlContent returns true for <p> tag', () => {
        expect(isHtmlContent('<p>Hello world</p>')).toBe(true)
    })

    it('isHtmlContent returns true for <p> with variable mention span', () => {
        expect(isHtmlContent('<p>Hello <span data-type="mention" data-id="question">{{question}}</span></p>')).toBe(true)
    })

    it('isHtmlContent returns true for <h1> heading tag', () => {
        expect(isHtmlContent('<h1>Title</h1>')).toBe(true)
    })

    it('isHtmlContent returns true for <h2> heading tag', () => {
        expect(isHtmlContent('<h2>Section</h2>')).toBe(true)
    })

    it('isHtmlContent returns true for <ul> list tag', () => {
        expect(isHtmlContent('<ul><li>item</li></ul>')).toBe(true)
    })

    it('isHtmlContent returns true for <pre><code> block', () => {
        expect(isHtmlContent('<pre><code>const x = 1</code></pre>')).toBe(true)
    })

    it('isHtmlContent returns true for <strong> tag', () => {
        expect(isHtmlContent('<strong>bold</strong>')).toBe(true)
    })

    it('isHtmlContent returns true for <em> tag', () => {
        expect(isHtmlContent('<em>italic</em>')).toBe(true)
    })

    it('isHtmlContent returns true for <blockquote> tag', () => {
        expect(isHtmlContent('<blockquote>quote</blockquote>')).toBe(true)
    })

    it('isHtmlContent returns true for multiline HTML with mixed content', () => {
        expect(isHtmlContent('<p>First paragraph</p>\n<p>Second paragraph</p>')).toBe(true)
    })

    it('isHtmlContent returns true for uppercase tag like <P>', () => {
        expect(isHtmlContent('<P>uppercase</P>')).toBe(true)
    })

    // getEditorMarkdown
    it('getEditorMarkdown returns markdown when getMarkdown() returns a non-empty string', () => {
        const editor = { getMarkdown: () => '## heading', getHTML: () => '<h2>heading</h2>', isEmpty: false }
        expect(getEditorMarkdown(editor)).toBe('## heading')
    })

    it('getEditorMarkdown returns empty string when getMarkdown() returns "" and editor is empty', () => {
        const editor = { getMarkdown: () => '', getHTML: () => '', isEmpty: true }
        expect(getEditorMarkdown(editor)).toBe('')
    })

    it('getEditorMarkdown falls back to HTML when getMarkdown() returns "" but editor is not empty', () => {
        const editor = { getMarkdown: () => '', getHTML: () => '<p>hello</p>', isEmpty: false }
        expect(getEditorMarkdown(editor)).toBe('<p>hello</p>')
    })

    it('getEditorMarkdown falls back to HTML when getMarkdown() throws', () => {
        const editor = {
            getMarkdown: () => {
                throw new Error('serialization failed')
            },
            getHTML: () => '<p>fallback</p>',
            isEmpty: false
        }
        expect(getEditorMarkdown(editor)).toBe('<p>fallback</p>')
    })
})
