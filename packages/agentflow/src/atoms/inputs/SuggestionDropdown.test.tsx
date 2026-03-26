import { createTheme, ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'

import { SuggestionDropdown, type SuggestionItem } from './SuggestionDropdown'

const theme = createTheme()

const ITEMS: SuggestionItem[] = [
    { id: 'question', label: 'question', description: "User's question", category: 'Chat Context' },
    { id: 'chat_history', label: 'chat_history', description: 'Conversation history', category: 'Chat Context' },
    { id: 'node1.data.instance', label: 'LLM Node', description: 'Output from LLM', category: 'Node Outputs' },
    { id: '$flow.state.count', label: '$flow.state.count', description: 'State variable', category: 'Flow State' }
]

let anchor: HTMLDivElement

function renderDropdown(props: Partial<React.ComponentProps<typeof SuggestionDropdown>> = {}) {
    const defaultProps = {
        items: ITEMS,
        query: '',
        anchorEl: anchor,
        onSelect: jest.fn(),
        onClose: jest.fn(),
        ...props
    }

    const result = render(
        <ThemeProvider theme={theme}>
            <SuggestionDropdown {...defaultProps} />
        </ThemeProvider>
    )

    return { ...result, ...defaultProps }
}

describe('SuggestionDropdown', () => {
    beforeEach(() => {
        anchor = document.createElement('div')
        document.body.appendChild(anchor)
    })

    afterEach(() => {
        if (anchor.parentNode) anchor.parentNode.removeChild(anchor)
    })

    it('renders grouped items by category', () => {
        renderDropdown()

        expect(screen.getByText('Chat Context')).toBeInTheDocument()
        expect(screen.getByText('Node Outputs')).toBeInTheDocument()
        expect(screen.getByText('Flow State')).toBeInTheDocument()
        expect(screen.getByText('question')).toBeInTheDocument()
        expect(screen.getByText('LLM Node')).toBeInTheDocument()
    })

    it('filters items by query', () => {
        renderDropdown({ query: 'que' })

        expect(screen.getByText('question')).toBeInTheDocument()
        expect(screen.queryByText('chat_history')).not.toBeInTheDocument()
        expect(screen.queryByText('LLM Node')).not.toBeInTheDocument()
    })

    it('renders nothing when no items match query', () => {
        renderDropdown({ query: 'zzz_nomatch' })

        expect(screen.queryByTestId('suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('renders nothing when anchorEl is null', () => {
        renderDropdown({ anchorEl: null })

        expect(screen.queryByTestId('suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('calls onSelect when an item is clicked', () => {
        const { onSelect } = renderDropdown()

        fireEvent.click(screen.getByText('question'))

        expect(onSelect).toHaveBeenCalledWith(ITEMS[0])
    })

    it('selects item with Enter key', () => {
        const { onSelect } = renderDropdown()

        fireEvent.keyDown(document, { key: 'Enter' })

        expect(onSelect).toHaveBeenCalledWith(ITEMS[0])
    })

    it('navigates with ArrowDown and selects', () => {
        const { onSelect } = renderDropdown()

        fireEvent.keyDown(document, { key: 'ArrowDown' })
        fireEvent.keyDown(document, { key: 'Enter' })

        expect(onSelect).toHaveBeenCalledWith(ITEMS[1])
    })

    it('navigates with ArrowUp (wraps around)', () => {
        const { onSelect } = renderDropdown()

        // ArrowUp from index 0 wraps to last item
        fireEvent.keyDown(document, { key: 'ArrowUp' })
        fireEvent.keyDown(document, { key: 'Enter' })

        expect(onSelect).toHaveBeenCalledWith(ITEMS[ITEMS.length - 1])
    })

    it('calls onClose on Escape', () => {
        const { onClose } = renderDropdown()

        fireEvent.keyDown(document, { key: 'Escape' })

        expect(onClose).toHaveBeenCalled()
    })

    it('shows descriptions for items', () => {
        renderDropdown()

        expect(screen.getByText("User's question")).toBeInTheDocument()
        expect(screen.getByText('Output from LLM')).toBeInTheDocument()
    })
})
