import { useState } from 'react'

import { createTheme, ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'

import type { SuggestionItem } from './SuggestionDropdown'
import { VariableInput, type VariableInputProps } from './VariableInput'

const theme = createTheme()

const SUGGESTION_ITEMS: SuggestionItem[] = [
    { id: 'question', label: 'question', description: "User's question", category: 'Chat Context' },
    { id: 'chat_history', label: 'chat_history', description: 'History', category: 'Chat Context' },
    { id: 'node1.data.instance', label: 'LLM Node', description: 'Output from LLM', category: 'Node Outputs' }
]

/** Stateful wrapper so the component re-renders with updated value after onChange */
function StatefulVariableInput(props: Partial<VariableInputProps>) {
    const [value, setValue] = useState(props.value ?? '')
    return (
        <ThemeProvider theme={theme}>
            <VariableInput
                value={value}
                onChange={(v) => {
                    setValue(v)
                    props.onChange?.(v)
                }}
                placeholder={props.placeholder}
                disabled={props.disabled}
                rows={props.rows}
                suggestionItems={props.suggestionItems ?? SUGGESTION_ITEMS}
            />
        </ThemeProvider>
    )
}

function renderVariableInput(props: Partial<VariableInputProps> = {}) {
    const onChangeMock = jest.fn()
    const mergedProps = { onChange: onChangeMock, ...props }

    const result = render(<StatefulVariableInput {...mergedProps} />)

    return { ...result, onChange: mergedProps.onChange }
}

/** Helper: simulate typing a value by setting selectionStart and firing change */
function typeValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
    // Set the native value and selectionStart before firing change
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set

    if (input.tagName === 'TEXTAREA') {
        nativeTextareaValueSetter?.call(input, value)
    } else {
        nativeInputValueSetter?.call(input, value)
    }

    // Set cursor to end of text
    input.selectionStart = value.length
    input.selectionEnd = value.length

    fireEvent.input(input, { bubbles: true })
    fireEvent.change(input, { target: { value } })
}

describe('VariableInput', () => {
    it('renders a text input with placeholder', () => {
        renderVariableInput({ placeholder: 'Type here...' })

        const input = screen.getByPlaceholderText('Type here...')
        expect(input).toBeInTheDocument()
    })

    it('renders with the given value', () => {
        renderVariableInput({ value: 'Hello world' })

        expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument()
    })

    it('is disabled when disabled prop is true', () => {
        renderVariableInput({ disabled: true })

        const input = screen.getByRole('textbox')
        expect(input).toBeDisabled()
    })

    it('calls onChange when text is typed', () => {
        const { onChange } = renderVariableInput()

        const input = screen.getByRole('textbox') as HTMLInputElement
        typeValue(input, 'Hello')

        expect(onChange).toHaveBeenCalledWith('Hello')
    })

    it('shows dropdown when {{ is typed', () => {
        renderVariableInput()

        const input = screen.getByRole('textbox') as HTMLInputElement
        typeValue(input, 'Hello {{')

        expect(screen.getByTestId('suggestion-dropdown')).toBeInTheDocument()
    })

    it('does not show dropdown without suggestion items', () => {
        renderVariableInput({ suggestionItems: [] })

        const input = screen.getByRole('textbox') as HTMLInputElement
        typeValue(input, 'Hello {{')

        expect(screen.queryByTestId('suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('does not show dropdown for regular text', () => {
        renderVariableInput()

        const input = screen.getByRole('textbox') as HTMLInputElement
        typeValue(input, 'Hello world')

        expect(screen.queryByTestId('suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('does not show dropdown when disabled', () => {
        renderVariableInput({ disabled: true, value: 'Hello {{' })

        expect(screen.queryByTestId('suggestion-dropdown')).not.toBeInTheDocument()
    })

    it('renders as multiline when rows is set', () => {
        renderVariableInput({ rows: 4 })

        const textarea = screen.getByRole('textbox')
        expect(textarea.tagName.toLowerCase()).toBe('textarea')
    })

    it('has correct test id', () => {
        renderVariableInput()

        expect(screen.getByTestId('variable-input')).toBeInTheDocument()
    })
})
