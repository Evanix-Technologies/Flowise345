/**
 * Custom TipTap Mention extension for `{{ variable }}` syntax.
 *
 * Port of packages/ui/src/utils/customMention.js to TypeScript,
 * adapted for @tiptap/extension-mention v2.
 */
import { PasteRule } from '@tiptap/core'
import Mention from '@tiptap/extension-mention'

export const CustomMention = Mention.extend({
    /**
     * Render mention nodes as `{{label}}` in plain text output.
     */
    renderText({ node }) {
        return `{{${node.attrs.label ?? node.attrs.id}}}`
    },

    /**
     * Paste rule: auto-convert `{{variable}}` text into mention nodes on paste.
     */
    addPasteRules() {
        return [
            new PasteRule({
                find: /\{\{([^{}]+)\}\}/g,
                handler: ({ match, chain, range }) => {
                    const label = match[1].trim()
                    if (label) {
                        chain()
                            .deleteRange(range)
                            .insertContentAt(range.from, {
                                type: this.name,
                                attrs: { id: label, label }
                            })
                    }
                }
            })
        ]
    }
})
