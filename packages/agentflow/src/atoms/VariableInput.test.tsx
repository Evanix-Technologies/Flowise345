import { createTheme, ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'

import { VariableInput, type VariableInputProps } from './VariableInput'

const theme = createTheme()

function renderVariableInput(props: Partial<VariableInputProps> = {}) {
    const defaultProps: VariableInputProps = {
        value: '',
        onChange: jest.fn(),
        ...props
    }

    const result = render(
        <ThemeProvider theme={theme}>
            <VariableInput {...defaultProps} />
        </ThemeProvider>
    )

    return { ...result, ...defaultProps }
}

describe('VariableInput', () => {
    it('renders the TipTap editor container', () => {
        renderVariableInput()

        expect(screen.getByTestId('variable-input')).toBeInTheDocument()
    })

    it('renders the TipTap editor content element', () => {
        renderVariableInput()

        // The mocked EditorContent renders a div with data-testid="tiptap-editor-content"
        expect(screen.getByTestId('tiptap-editor-content')).toBeInTheDocument()
    })

    it('passes editor instance to EditorContent', () => {
        renderVariableInput({ value: 'Hello' })

        const editorContent = screen.getByTestId('tiptap-editor-content')
        expect(editorContent).toHaveAttribute('data-has-editor', 'true')
    })

    it('renders without suggestion items', () => {
        renderVariableInput({ suggestionItems: undefined })

        expect(screen.getByTestId('variable-input')).toBeInTheDocument()
    })

    it('renders with suggestion items', () => {
        renderVariableInput({
            suggestionItems: [{ id: 'question', label: 'question', description: "User's question", category: 'Chat Context' }]
        })

        expect(screen.getByTestId('variable-input')).toBeInTheDocument()
    })

    it('renders with placeholder', () => {
        renderVariableInput({ placeholder: 'Type here...' })

        expect(screen.getByTestId('variable-input')).toBeInTheDocument()
    })

    it('renders in disabled state', () => {
        renderVariableInput({ disabled: true })

        expect(screen.getByTestId('variable-input')).toBeInTheDocument()
    })
})
