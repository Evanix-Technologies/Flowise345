/**
 * Returns true when `content` looks like legacy HTML (saved by the old getHTML()
 * serializer), so callers can choose the right TipTap `setContent` contentType.
 *
 * Ported from packages/ui/src/ui-component/input/RichInput.jsx (PR #6021).
 * A simple tag-presence check is intentionally used here — it is fast, has no
 * dependencies, and the false-positive/negative risk for agentflow node inputs
 * is negligible (users don't normally write raw HTML into prompt fields).
 */
export function isHtmlContent(content: unknown): boolean {
    if (!content || typeof content !== 'string') return false
    return /<(?:p|div|span|h[1-6]|ul|ol|li|br|code|pre|blockquote|table|strong|em)\b/i.test(content)
}
