import { useCallback, useEffect, useRef, useState } from 'react'

import { TextField } from '@mui/material'

import { detectTrigger, resolveVariableInsert } from '@/core/utils/variableUtils'

import { SuggestionDropdown, type SuggestionItem } from './SuggestionDropdown'

export interface VariableInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    /** Number of visible text rows. When set, renders as a multiline textarea. */
    rows?: number
    /** Available variables for autocomplete when typing `{{` */
    suggestionItems?: SuggestionItem[]
}

/**
 * A controlled text input that detects `{{` typing and shows an autocomplete
 * dropdown with available variables. Wraps MUI TextField.
 */
export function VariableInput({ value, onChange, placeholder, disabled = false, rows, suggestionItems }: VariableInputProps) {
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
    const [triggerState, setTriggerState] = useState<{ query: string; triggerIndex: number } | null>(null)

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const newValue = e.target.value
            onChange(newValue)

            // Check for {{ trigger
            if (!suggestionItems || suggestionItems.length === 0) {
                setTriggerState(null)
                return
            }

            const cursorPos = e.target.selectionStart ?? newValue.length
            const textBeforeCursor = newValue.slice(0, cursorPos)
            const trigger = detectTrigger(textBeforeCursor)
            setTriggerState(trigger)
        },
        [onChange, suggestionItems]
    )

    const handleSelect = useCallback(
        (item: SuggestionItem) => {
            if (!triggerState) return

            const newValue = resolveVariableInsert(value, triggerState.triggerIndex, item.label)
            onChange(newValue)
            setTriggerState(null)

            // Restore focus to input after selection
            requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus()
                    // Place cursor after the inserted variable
                    const cursorPos = triggerState.triggerIndex + item.label.length + 4 // {{ + label + }}
                    inputRef.current.setSelectionRange(cursorPos, cursorPos)
                }
            })
        },
        [value, onChange, triggerState]
    )

    const handleClose = useCallback(() => {
        setTriggerState(null)
    }, [])

    // Close dropdown when clicking outside or input loses focus
    const handleBlur = useCallback(() => {
        // Delay to allow click on dropdown item to register
        setTimeout(() => {
            if (!inputRef.current?.contains(document.activeElement)) {
                setTriggerState(null)
            }
        }, 200)
    }, [])

    // Close on cursor movement away from trigger
    const handleKeyUp = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (!triggerState || !suggestionItems?.length) return

            // If arrow keys or Home/End moved cursor, re-check trigger
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                const input = inputRef.current
                if (!input) return
                const cursorPos = input.selectionStart ?? 0
                const textBeforeCursor = value.slice(0, cursorPos)
                const trigger = detectTrigger(textBeforeCursor)
                setTriggerState(trigger)
            }
        },
        [triggerState, suggestionItems, value]
    )

    // Sync: close dropdown when value changes externally and trigger no longer valid
    useEffect(() => {
        if (triggerState) {
            const input = inputRef.current
            if (!input) return
            const cursorPos = input.selectionStart ?? value.length
            const textBeforeCursor = value.slice(0, cursorPos)
            const trigger = detectTrigger(textBeforeCursor)
            if (!trigger) setTriggerState(null)
        }
    }, [value, triggerState])

    return (
        <>
            <TextField
                fullWidth
                size='small'
                disabled={disabled}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyUp={handleKeyUp}
                multiline={!!rows}
                rows={rows}
                inputRef={inputRef}
                sx={{ mt: 1 }}
                data-testid='variable-input'
            />
            {triggerState && suggestionItems && suggestionItems.length > 0 && (
                <SuggestionDropdown
                    items={suggestionItems}
                    query={triggerState.query}
                    anchorEl={inputRef.current}
                    onSelect={handleSelect}
                    onClose={handleClose}
                />
            )}
        </>
    )
}
