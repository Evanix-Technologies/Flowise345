import { render, screen } from '@testing-library/react'

import { RichTextEditor } from './RichTextEditor'

// --- Mock TipTap ---
// Capture the onUpdate callback type matching the new markdown-based API
let capturedOnUpdate: ((args: { editor: { storage: { markdown: { getMarkdown: () => string } } } }) => void) | undefined

jest.mock('@tiptap/react', () => ({
    useEditor: (config: Record<string, unknown>) => {
        // Capture the onUpdate callback so tests can simulate edits
        capturedOnUpdate = config.onUpdate as typeof capturedOnUpdate
        return {
            setEditable: jest.fn(),
            commands: { focus: jest.fn(), setContent: jest.fn() },
            storage: { markdown: { getMarkdown: () => 'mock markdown' } }
        }
    },
    EditorContent: ({ editor, ...rest }: { editor: unknown; [key: string]: unknown }) => (
        <div data-testid='tiptap-editor-content' data-has-editor={!!editor} {...rest} />
    )
}))

jest.mock('@tiptap/starter-kit', () => ({
    __esModule: true,
    default: { configure: jest.fn(() => 'StarterKit') }
}))

jest.mock('@tiptap/extension-code-block-lowlight', () => ({
    __esModule: true,
    default: {
        configure: jest.fn(() => 'CodeBlockLowlight'),
        extend: jest.fn(() => 'CodeBlockLowlightExtended')
    }
}))

jest.mock('@tiptap/extension-placeholder', () => ({
    __esModule: true,
    default: { configure: jest.fn(() => 'Placeholder') }
}))

jest.mock('@tiptap/markdown', () => ({
    Markdown: { configure: jest.fn(() => 'Markdown') }
}))

jest.mock('lowlight', () => ({
    common: {},
    createLowlight: jest.fn(() => ({ register: jest.fn() }))
}))

const mockOnChange = jest.fn()

beforeEach(() => {
    jest.clearAllMocks()
    capturedOnUpdate = undefined
})

describe('RichTextEditor', () => {
    it('should render the editor container', () => {
        render(<RichTextEditor value='Hello' onChange={mockOnChange} />)

        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
        expect(screen.getByTestId('tiptap-editor-content')).toBeInTheDocument()
    })

    it('should pass the editor instance to EditorContent', () => {
        render(<RichTextEditor value='Hello' onChange={mockOnChange} />)

        expect(screen.getByTestId('tiptap-editor-content')).toHaveAttribute('data-has-editor', 'true')
    })

    it('should call onChange with markdown when editor content updates', () => {
        render(<RichTextEditor value='' onChange={mockOnChange} />)

        expect(capturedOnUpdate).toBeDefined()
        capturedOnUpdate!({ editor: { storage: { markdown: { getMarkdown: () => '**Updated**' } } } })

        expect(mockOnChange).toHaveBeenCalledWith('**Updated**')
    })

    it('should not call onChange with HTML', () => {
        render(<RichTextEditor value='' onChange={mockOnChange} />)

        capturedOnUpdate!({ editor: { storage: { markdown: { getMarkdown: () => '## Heading' } } } })

        // Must be the markdown string, not wrapped in HTML tags
        expect(mockOnChange).toHaveBeenCalledWith('## Heading')
        expect(mockOnChange).not.toHaveBeenCalledWith(expect.stringContaining('<h2>'))
    })

    it('should render with rows prop', () => {
        render(<RichTextEditor value='' onChange={mockOnChange} rows={15} />)

        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
    })

    it('should render in disabled state', () => {
        render(<RichTextEditor value='' onChange={mockOnChange} disabled={true} />)

        expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument()
    })
})
