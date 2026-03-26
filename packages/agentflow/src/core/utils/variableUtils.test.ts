import { detectTrigger, extractVariables, getUpstreamNodes, resolveVariableInsert } from './variableUtils'

// ── extractVariables ────────────────────────────────────────────────────────

describe('extractVariables', () => {
    it('returns empty array for empty string', () => {
        expect(extractVariables('')).toEqual([])
    })

    it('returns empty array for text without variables', () => {
        expect(extractVariables('Hello world')).toEqual([])
    })

    it('extracts a single variable', () => {
        expect(extractVariables('Hello {{question}}')).toEqual(['question'])
    })

    it('extracts multiple variables', () => {
        expect(extractVariables('{{question}} and {{chat_history}}')).toEqual(['question', 'chat_history'])
    })

    it('extracts node output references', () => {
        expect(extractVariables('Result: {{node1.data.instance}}')).toEqual(['node1.data.instance'])
    })

    it('extracts flow state variables', () => {
        expect(extractVariables('Count is {{$flow.state.count}}')).toEqual(['$flow.state.count'])
    })

    it('trims whitespace inside braces', () => {
        expect(extractVariables('{{ question }}')).toEqual(['question'])
    })

    it('does not match single braces', () => {
        expect(extractVariables('{notAVariable}')).toEqual([])
    })

    it('skips JSON-like content with colons', () => {
        expect(extractVariables('{{"key": "value"}}')).toEqual([])
        expect(extractVariables('{{"name": "test"}} and {{question}}')).toEqual(['question'])
    })

    it('does not match nested braces', () => {
        expect(extractVariables('{{{nested}}}')).toEqual(['nested'])
    })

    it('does not match unclosed braces', () => {
        expect(extractVariables('{{unclosed')).toEqual([])
    })

    it('handles mixed text and variables', () => {
        expect(extractVariables('Say {{question}} to {{node1.data.instance}} please')).toEqual(['question', 'node1.data.instance'])
    })
})

// ── resolveVariableInsert ───────────────────────────────────────────────────

describe('resolveVariableInsert', () => {
    it('replaces partial trigger with full variable token', () => {
        expect(resolveVariableInsert('Hello {{que', 6, 'question')).toBe('Hello {{question}}')
    })

    it('replaces empty trigger with full variable token', () => {
        expect(resolveVariableInsert('Hello {{', 6, 'question')).toBe('Hello {{question}}')
    })

    it('works at the start of text', () => {
        expect(resolveVariableInsert('{{ch', 0, 'chat_history')).toBe('{{chat_history}}')
    })

    it('preserves text after the trigger when no closing braces', () => {
        // If user typed "Hello {{que" and cursor is at end
        expect(resolveVariableInsert('Hello {{que', 6, 'question')).toBe('Hello {{question}}')
    })

    it('handles node output paths', () => {
        expect(resolveVariableInsert('Use {{nod', 4, 'node1.data.instance')).toBe('Use {{node1.data.instance}}')
    })

    it('handles flow state paths', () => {
        expect(resolveVariableInsert('Val: {{$fl', 5, '$flow.state.count')).toBe('Val: {{$flow.state.count}}')
    })
})

// ── detectTrigger ───────────────────────────────────────────────────────────

describe('detectTrigger', () => {
    it('returns null for text without trigger', () => {
        expect(detectTrigger('Hello world')).toBeNull()
    })

    it('returns null for completed variable', () => {
        expect(detectTrigger('Hello {{question}}')).toBeNull()
    })

    it('detects empty trigger', () => {
        expect(detectTrigger('Hello {{')).toEqual({ query: '', triggerIndex: 6 })
    })

    it('detects trigger with partial query', () => {
        expect(detectTrigger('Hello {{que')).toEqual({ query: 'que', triggerIndex: 6 })
    })

    it('detects trigger after completed variable', () => {
        expect(detectTrigger('{{question}} and {{')).toEqual({ query: '', triggerIndex: 17 })
    })

    it('detects trigger with dot-path query', () => {
        expect(detectTrigger('{{$flow.sta')).toEqual({ query: '$flow.sta', triggerIndex: 0 })
    })

    it('returns null for single brace', () => {
        expect(detectTrigger('Hello {')).toBeNull()
    })
})

// ── getUpstreamNodes ────────────────────────────────────────────────────────

describe('getUpstreamNodes', () => {
    const makeNode = (
        id: string
    ): { id: string; type: string; position: { x: number; y: number }; data: { id: string; name: string; label: string } } => ({
        id,
        type: 'customNode',
        position: { x: 0, y: 0 },
        data: { id, name: id, label: id }
    })

    const makeEdge = (source: string, target: string) => ({
        id: `${source}-${target}`,
        source,
        target,
        type: 'default'
    })

    it('returns empty array when no edges target the node', () => {
        const nodes = [makeNode('a'), makeNode('b')]
        const edges = [makeEdge('a', 'b')]
        expect(getUpstreamNodes('a', nodes, edges)).toEqual([])
    })

    it('returns direct upstream nodes', () => {
        const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
        const edges = [makeEdge('a', 'b'), makeEdge('b', 'c')]
        const upstream = getUpstreamNodes('b', nodes, edges)
        expect(upstream).toHaveLength(1)
        expect(upstream[0].id).toBe('a')
    })

    it('returns multiple upstream nodes', () => {
        const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
        const edges = [makeEdge('a', 'c'), makeEdge('b', 'c')]
        const upstream = getUpstreamNodes('c', nodes, edges)
        expect(upstream).toHaveLength(2)
        expect(upstream.map((n) => n.id).sort()).toEqual(['a', 'b'])
    })

    it('does not return downstream nodes', () => {
        const nodes = [makeNode('a'), makeNode('b'), makeNode('c')]
        const edges = [makeEdge('a', 'b'), makeEdge('b', 'c')]
        const upstream = getUpstreamNodes('a', nodes, edges)
        expect(upstream).toHaveLength(0)
    })

    it('returns empty array when edges array is empty', () => {
        const nodes = [makeNode('a')]
        expect(getUpstreamNodes('a', nodes, [])).toEqual([])
    })
})
