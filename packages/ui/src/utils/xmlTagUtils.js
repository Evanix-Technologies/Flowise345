/**
 * Utilities for preserving non-standard XML/HTML tags (e.g. <question>, <context>)
 * through TipTap's markdown roundtrip.
 *
 * Problem: When content like `<question>text</question>` is parsed by marked (via @tiptap/markdown),
 * the lexer tokenizes non-standard tags as HTML tokens. TipTap's parseHTMLToken then calls
 * generateJSON which creates DOM elements — since no extension recognizes custom tags,
 * the tag wrappers are stripped and only inner text survives.
 *
 * Solution: Three-step process:
 *   1. escapeCustomXmlTags: Convert non-standard tags to HTML entities before markdown parsing
 *      so marked treats them as text, not HTML tokens.
 *   2. unescapeXmlEntities: After TipTap builds the ProseMirror document, walk the JSON tree
 *      and decode &lt;/&gt; back to </>  in text nodes for proper visual display.
 *   3. unescapeCustomXmlTags: After getMarkdown(), reverse any remaining entity-escaped tags
 *      in the serialized output (safety net — typically a no-op).
 */

// Standard HTML tags that should NOT be escaped — they have real HTML semantics
// and are handled by TipTap extensions or the browser's HTML parser.
const STANDARD_HTML_TAGS = new Set([
    // Document structure
    'html',
    'head',
    'body',
    // Sectioning
    'article',
    'aside',
    'footer',
    'header',
    'main',
    'nav',
    'section',
    // Block content
    'div',
    'p',
    'blockquote',
    'pre',
    'hr',
    'figure',
    'figcaption',
    'details',
    'summary',
    'dialog',
    // Headings
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // Lists
    'ul',
    'ol',
    'li',
    'dl',
    'dt',
    'dd',
    // Tables
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'caption',
    'colgroup',
    'col',
    // Inline text
    'span',
    'a',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'strike',
    'code',
    'kbd',
    'samp',
    'var',
    'mark',
    'small',
    'sub',
    'sup',
    'abbr',
    'cite',
    'dfn',
    'q',
    'time',
    'data',
    'ruby',
    'rt',
    'rp',
    // Breaks
    'br',
    'wbr',
    // Media & embeds
    'img',
    'picture',
    'source',
    'video',
    'audio',
    'track',
    'iframe',
    'embed',
    'object',
    'param',
    'canvas',
    'svg',
    'math',
    // Forms
    'form',
    'input',
    'textarea',
    'select',
    'option',
    'optgroup',
    'button',
    'label',
    'fieldset',
    'legend',
    'datalist',
    'output',
    'meter',
    'progress',
    // Scripting (these are typically forbidden by sanitizers, but they ARE standard HTML)
    'script',
    'noscript',
    'template',
    'slot',
    // Other
    'link',
    'meta',
    'style',
    'title',
    'base',
    // Deprecated but still recognized
    'center',
    'font',
    'big',
    'tt'
])

/**
 * Regex matching opening, closing, and self-closing XML/HTML tags.
 * Captures: (1) optional slash, (2) tag name, (3) optional attributes, (4) optional self-close slash
 */
const XML_TAG_REGEX = /<(\/?)([a-zA-Z][a-zA-Z0-9_.-]*)(\s[^>]*)?(\/?)>/g

/**
 * Escape non-standard XML/HTML tags to HTML entities so marked doesn't parse them as HTML.
 * Standard HTML tags are left untouched for normal processing.
 *
 * @example
 * escapeCustomXmlTags('<instructions>Be helpful</instructions>')
 * // → '&lt;instructions&gt;Be helpful&lt;/instructions&gt;'
 *
 * escapeCustomXmlTags('<div><question>text</question></div>')
 * // → '<div>&lt;question&gt;text&lt;/question&gt;</div>'
 *
 * @param {string} text - Raw markdown/text content
 * @returns {string} Content with non-standard tags escaped to HTML entities
 */
export function escapeCustomXmlTags(text) {
    if (!text || typeof text !== 'string') return text
    return text.replace(XML_TAG_REGEX, (match, slash, tagName, attrs, selfClose) => {
        if (STANDARD_HTML_TAGS.has(tagName.toLowerCase())) return match
        return `&lt;${slash}${tagName}${attrs || ''}${selfClose}&gt;`
    })
}

/**
 * Decode HTML entities (&lt; &gt;) back to angle brackets in ProseMirror JSON text nodes.
 * Call this after setContent() to fix the visual display in the editor.
 * Mutates the JSON in-place and returns it.
 *
 * @example
 * const json = { type: 'doc', content: [
 *   { type: 'paragraph', content: [{ type: 'text', text: '&lt;question&gt;What?&lt;/question&gt;' }] }
 * ]}
 * unescapeXmlEntities(json)
 * // json.content[0].content[0].text → '<question>What?</question>'
 *
 * @param {object} json - ProseMirror document JSON from editor.getJSON()
 * @returns {object} The same JSON with decoded entities in text nodes
 */
export function unescapeXmlEntities(json) {
    if (json.text) {
        json.text = json.text.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    }
    if (json.content) {
        json.content.forEach(unescapeXmlEntities)
    }
    return json
}

/**
 * Unescape non-standard XML/HTML tags after markdown serialization.
 * Handles entity-escaped tags in the output for robustness.
 *
 * @example
 * unescapeCustomXmlTags('&lt;question&gt;text&lt;/question&gt;')
 * // → '<question>text</question>'
 *
 * unescapeCustomXmlTags('<question>text</question>')
 * // → '<question>text</question>'  (raw tags pass through unchanged)
 *
 * @param {string} text - Markdown output from TipTap
 * @returns {string} Content with non-standard tags restored to angle brackets
 */
export function unescapeCustomXmlTags(text) {
    if (!text || typeof text !== 'string') return text
    return text.replace(/&lt;(\/?)([a-zA-Z][a-zA-Z0-9_.-]*)(\s[^&]*)?(\/?)&gt;/g, (match, slash, tagName, attrs, selfClose) => {
        if (STANDARD_HTML_TAGS.has(tagName.toLowerCase())) return match
        return `<${slash}${tagName}${attrs || ''}${selfClose}>`
    })
}
