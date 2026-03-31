import { escapeCustomXmlTags, unescapeXmlEntities, unescapeCustomXmlTags } from './xmlTagUtils'

describe('xmlTagUtils', () => {
    describe('escapeCustomXmlTags', () => {
        it('should escape non-standard opening tags to entities', () => {
            expect(escapeCustomXmlTags('<question>text</question>')).toBe('&lt;question&gt;text&lt;/question&gt;')
        })

        it('should escape non-standard self-closing tags', () => {
            expect(escapeCustomXmlTags('<my-separator />')).toBe('&lt;my-separator /&gt;')
        })

        it('should escape tags with attributes', () => {
            expect(escapeCustomXmlTags('<context type="user">hello</context>')).toBe('&lt;context type="user"&gt;hello&lt;/context&gt;')
        })

        it('should NOT escape standard HTML tags', () => {
            const html = '<div><p>text</p><strong>bold</strong></div>'
            expect(escapeCustomXmlTags(html)).toBe(html)
        })

        it('should handle mixed standard and custom tags', () => {
            const input = '# Heading\n<question>What is {{name}}?</question>\n<p>paragraph</p>'
            const expected = '# Heading\n&lt;question&gt;What is {{name}}?&lt;/question&gt;\n<p>paragraph</p>'
            expect(escapeCustomXmlTags(input)).toBe(expected)
        })

        it('should handle nested custom tags', () => {
            const input = '<outer><inner>text</inner></outer>'
            const expected = '&lt;outer&gt;&lt;inner&gt;text&lt;/inner&gt;&lt;/outer&gt;'
            expect(escapeCustomXmlTags(input)).toBe(expected)
        })

        it('should return empty/null/undefined as-is', () => {
            expect(escapeCustomXmlTags('')).toBe('')
            expect(escapeCustomXmlTags(null)).toBe(null)
            expect(escapeCustomXmlTags(undefined)).toBe(undefined)
        })

        it('should handle text with no tags', () => {
            expect(escapeCustomXmlTags('just plain text')).toBe('just plain text')
        })

        it('should handle tags with dots and hyphens in names', () => {
            expect(escapeCustomXmlTags('<my.tag>text</my.tag>')).toBe('&lt;my.tag&gt;text&lt;/my.tag&gt;')
            expect(escapeCustomXmlTags('<my-tag>text</my-tag>')).toBe('&lt;my-tag&gt;text&lt;/my-tag&gt;')
        })

        it('should not double-escape already-escaped content', () => {
            const alreadyEscaped = '&lt;question&gt;text&lt;/question&gt;'
            expect(escapeCustomXmlTags(alreadyEscaped)).toBe(alreadyEscaped)
        })
    })

    describe('unescapeXmlEntities', () => {
        it('should decode entities in text nodes', () => {
            const json = {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '&lt;question&gt;What?&lt;/question&gt;' }]
                    }
                ]
            }
            unescapeXmlEntities(json)
            expect(json.content[0].content[0].text).toBe('<question>What?</question>')
        })

        it('should handle nested content', () => {
            const json = {
                type: 'doc',
                content: [
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '&lt;outer&gt;' }]
                    },
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '&lt;inner&gt;text&lt;/inner&gt;' }]
                    },
                    {
                        type: 'paragraph',
                        content: [{ type: 'text', text: '&lt;/outer&gt;' }]
                    }
                ]
            }
            unescapeXmlEntities(json)
            expect(json.content[0].content[0].text).toBe('<outer>')
            expect(json.content[1].content[0].text).toBe('<inner>text</inner>')
            expect(json.content[2].content[0].text).toBe('</outer>')
        })

        it('should not modify nodes without entities', () => {
            const json = {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'plain text' }] }]
            }
            unescapeXmlEntities(json)
            expect(json.content[0].content[0].text).toBe('plain text')
        })

        it('should return the same object for chaining', () => {
            const json = { type: 'doc', content: [] }
            expect(unescapeXmlEntities(json)).toBe(json)
        })
    })

    describe('unescapeCustomXmlTags', () => {
        it('should unescape entity-escaped non-standard tags', () => {
            expect(unescapeCustomXmlTags('&lt;question&gt;text&lt;/question&gt;')).toBe('<question>text</question>')
        })

        it('should unescape tags with attributes', () => {
            expect(unescapeCustomXmlTags('&lt;context type="user"&gt;hello&lt;/context&gt;')).toBe('<context type="user">hello</context>')
        })

        it('should NOT unescape standard HTML entity-escaped tags', () => {
            const input = '&lt;div&gt;text&lt;/div&gt;'
            expect(unescapeCustomXmlTags(input)).toBe(input)
        })

        it('should handle mixed content', () => {
            const input = '# Heading\n&lt;question&gt;text&lt;/question&gt;\nsome markdown'
            const expected = '# Heading\n<question>text</question>\nsome markdown'
            expect(unescapeCustomXmlTags(input)).toBe(expected)
        })

        it('should return empty/null/undefined as-is', () => {
            expect(unescapeCustomXmlTags('')).toBe('')
            expect(unescapeCustomXmlTags(null)).toBe(null)
            expect(unescapeCustomXmlTags(undefined)).toBe(undefined)
        })

        it('should pass through raw (unescaped) tags unchanged', () => {
            expect(unescapeCustomXmlTags('<question>text</question>')).toBe('<question>text</question>')
        })
    })

    describe('roundtrip (escape → unescape)', () => {
        const cases = [
            '<question>What is the answer?</question>',
            '<context type="system">You are helpful</context>',
            '<instructions>\n- Step 1\n- Step 2\n</instructions>',
            '<outer><inner>nested</inner></outer>',
            '# Title\n<question>{{input}}</question>\n**bold** text',
            '<my-component />',
            'No tags here, just **markdown**',
            '<div>standard html stays</div>',
            '<example>This has <strong>standard</strong> HTML inside</example>'
        ]

        cases.forEach((input) => {
            it(`should roundtrip: ${input.substring(0, 50)}...`, () => {
                const escaped = escapeCustomXmlTags(input)
                const restored = unescapeCustomXmlTags(escaped)
                expect(restored).toBe(input)
            })
        })
    })

    /**
     * Simulates the full editor save/reload cycle as it happens in RichInput:
     *
     *   LOAD (saved value → editor):
     *     1. escapeCustomXmlTags(savedValue)     — entities prevent marked from stripping tags
     *     2. setContent(escaped, 'markdown')      — marked parses entities as text nodes
     *     3. unescapeXmlEntities(editor.getJSON())  — fix "&lt;" → "<" in ProseMirror JSON
     *     4. setContent(decodedJson)              — editor now displays <question> correctly
     *
     *   SAVE (editor → saved value):
     *     5. editor.getMarkdown()                 — serializes text nodes with raw "<"
     *     6. unescapeCustomXmlTags(markdown)       — safety net for any remaining entities
     *     7. onChange(result)                      — written to flow JSON
     */
    describe('full editor save/reload cycle', () => {
        function simulateEditorCycle(userInput) {
            // --- LOAD ---
            // Step 1: escape XML tags to entities
            const escaped = escapeCustomXmlTags(userInput)
            // Steps 2-3: marked creates text nodes with entities, then unescapeXmlEntities fixes them
            const mockJson = {
                type: 'doc',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: escaped }] }]
            }
            unescapeXmlEntities(mockJson)
            // Step 4: verify editor would display proper angle brackets (no entities)
            const editorDisplayText = mockJson.content[0].content[0].text
            expect(editorDisplayText).not.toMatch(/&lt;|&gt;/)

            // --- SAVE ---
            // Step 5: getMarkdown() outputs text node content as-is (no escaping)
            const markdownOutput = editorDisplayText
            // Step 6: unescape safety net
            return unescapeCustomXmlTags(markdownOutput)
        }

        it('should preserve XML-tagged prompt', () => {
            const userInput = '<question>What is the answer?</question>'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should preserve tags with attributes', () => {
            const userInput = '<context type="system">You are helpful</context>'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should preserve multiline structured prompt', () => {
            const userInput = '<instructions>\n- Step 1\n- Step 2\n</instructions>'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should preserve nested XML tags', () => {
            const userInput = '<outer><inner>nested</inner></outer>'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should preserve XML tags mixed with markdown and variables', () => {
            const userInput = '# Title\n<question>{{input}}</question>\n**bold** text'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should leave standard HTML unchanged', () => {
            const userInput = '<div>standard html stays</div>'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should handle mixed custom and standard tags', () => {
            const userInput = '<example>This has <strong>standard</strong> HTML inside</example>'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })

        it('should leave plain markdown unchanged', () => {
            const userInput = 'No tags here, just **markdown**'
            expect(simulateEditorCycle(userInput)).toBe(userInput)
        })
    })
})
