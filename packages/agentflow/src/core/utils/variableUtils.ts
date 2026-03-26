import type { FlowEdge, FlowNode } from '@/core/types'

/** Regex that matches `{{variablePath}}` tokens in text. Use with `g` flag. */
export const VARIABLE_REGEX = /\{\{([^{}]+)\}\}/g

/** Regex that detects an unclosed `{{` trigger at the end of text (for autocomplete). */
export const TRIGGER_REGEX = /\{\{([^{}]*)$/

/**
 * Extract all variable paths from a string containing `{{variable}}` tokens.
 *
 * @example
 * extractVariables('Hello {{question}}, see {{node1.data.instance}}')
 * // => ['question', 'node1.data.instance']
 */
export function extractVariables(text: string): string[] {
    const matches: string[] = []
    let match: RegExpExecArray | null
    // Reset lastIndex for safety (global regex)
    VARIABLE_REGEX.lastIndex = 0
    while ((match = VARIABLE_REGEX.exec(text)) !== null) {
        const inside = match[1].trim()
        // Skip JSON-like content (e.g. {{"key": "value"}})
        if (!inside.includes(':')) {
            matches.push(inside)
        }
    }
    return matches
}

/**
 * Replace the partial `{{query` at `triggerIndex` with the full `{{variablePath}}` token.
 *
 * @param text        Current input text
 * @param triggerIndex  Index of the opening `{{` in the text
 * @param variablePath  The variable path to insert (without braces)
 * @returns Updated text with the variable inserted
 *
 * @example
 * resolveVariableInsert('Hello {{que', 6, 'question')
 * // => 'Hello {{question}}'
 */
export function resolveVariableInsert(text: string, triggerIndex: number, variablePath: string): string {
    const before = text.slice(0, triggerIndex)
    // Find the end of the partial query — everything after `{{` up to cursor (end of string or next `}}`)
    const afterTrigger = text.slice(triggerIndex)
    // Match the `{{partialQuery` portion and replace with complete token
    const replaced = afterTrigger.replace(/^\{\{[^{}]*/, `{{${variablePath}}}`)
    return before + replaced
}

/**
 * Walk edges backward from `nodeId` to collect all direct upstream source nodes.
 */
export function getUpstreamNodes(nodeId: string, nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
    const sourceIds = new Set<string>()
    for (const edge of edges) {
        if (edge.target === nodeId) {
            sourceIds.add(edge.source)
        }
    }
    return nodes.filter((n) => sourceIds.has(n.id))
}

/**
 * Detect whether the text before the cursor contains an unclosed `{{` trigger.
 * Returns the query string (text after `{{`) and the trigger index, or null if no trigger.
 */
export function detectTrigger(textBeforeCursor: string): { query: string; triggerIndex: number } | null {
    const match = TRIGGER_REGEX.exec(textBeforeCursor)
    if (!match) return null
    return {
        query: match[1],
        triggerIndex: match.index
    }
}
