import { isHtmlContent } from './editorUtils'

describe('isHtmlContent', () => {
    // Falsy / non-string inputs
    it('returns false for empty string', () => {
        expect(isHtmlContent('')).toBe(false)
    })

    it('returns false for null', () => {
        expect(isHtmlContent(null)).toBe(false)
    })

    it('returns false for undefined', () => {
        expect(isHtmlContent(undefined)).toBe(false)
    })

    it('returns false for a number', () => {
        expect(isHtmlContent(42)).toBe(false)
    })

    // Markdown content (must NOT be detected as HTML)
    it('returns false for plain text', () => {
        expect(isHtmlContent('You are a helpful assistant.')).toBe(false)
    })

    it('returns false for markdown heading', () => {
        expect(isHtmlContent('## My heading')).toBe(false)
    })

    it('returns false for markdown bullet list', () => {
        expect(isHtmlContent('- item 1\n- item 2')).toBe(false)
    })

    it('returns false for markdown with variable syntax', () => {
        expect(isHtmlContent('Hello {{question}}, today is {{current_date_time}}')).toBe(false)
    })

    it('returns false for markdown code fence', () => {
        expect(isHtmlContent('```js\nconsole.log("hello")\n```')).toBe(false)
    })

    it('returns false for markdown bold/italic', () => {
        expect(isHtmlContent('**bold** and *italic* text')).toBe(false)
    })

    // Legacy HTML content (MUST be detected)
    it('returns true for <p> tag', () => {
        expect(isHtmlContent('<p>Hello world</p>')).toBe(true)
    })

    it('returns true for <p> with variable mention span', () => {
        expect(isHtmlContent('<p>Hello <span data-type="mention" data-id="question">{{question}}</span></p>')).toBe(true)
    })

    it('returns true for <h1> heading tag', () => {
        expect(isHtmlContent('<h1>Title</h1>')).toBe(true)
    })

    it('returns true for <h2> heading tag', () => {
        expect(isHtmlContent('<h2>Section</h2>')).toBe(true)
    })

    it('returns true for <ul> list tag', () => {
        expect(isHtmlContent('<ul><li>item</li></ul>')).toBe(true)
    })

    it('returns true for <pre><code> block', () => {
        expect(isHtmlContent('<pre><code>const x = 1</code></pre>')).toBe(true)
    })

    it('returns true for <strong> tag', () => {
        expect(isHtmlContent('<strong>bold</strong>')).toBe(true)
    })

    it('returns true for <em> tag', () => {
        expect(isHtmlContent('<em>italic</em>')).toBe(true)
    })

    it('returns true for <blockquote> tag', () => {
        expect(isHtmlContent('<blockquote>quote</blockquote>')).toBe(true)
    })

    it('returns true for multiline HTML with mixed content', () => {
        expect(isHtmlContent('<p>First paragraph</p>\n<p>Second paragraph</p>')).toBe(true)
    })

    // Case-insensitivity
    it('returns true for uppercase tag like <P>', () => {
        expect(isHtmlContent('<P>uppercase</P>')).toBe(true)
    })
})
