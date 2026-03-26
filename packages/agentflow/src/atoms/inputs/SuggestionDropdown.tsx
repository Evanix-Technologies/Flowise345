import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Box, Divider, List, ListItemButton, ListItemText, Paper, Popper, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { IconBinaryTree, IconHistory, IconMessageChatbot, IconPaperclip } from '@tabler/icons-react'

export interface SuggestionItem {
    id: string
    label: string
    description?: string
    category?: string
}

export interface SuggestionDropdownProps {
    items: SuggestionItem[]
    query: string
    anchorEl: HTMLElement | null
    onSelect: (item: SuggestionItem) => void
    onClose: () => void
}

const CATEGORY_ICON: Record<string, { icon: React.ElementType; color: string }> = {
    'Chat Context': { icon: IconMessageChatbot, color: '#6EC6E6' },
    'Node Outputs': { icon: IconHistory, color: '#64B5F6' },
    'Flow State': { icon: IconBinaryTree, color: '#FFA07A' }
}

const DEFAULT_ICON = { icon: IconPaperclip, color: '#90A4AE' }

/**
 * Autocomplete dropdown for variable suggestions.
 * Filters items by query, groups by category, supports keyboard navigation.
 */
export function SuggestionDropdown({ items, query, anchorEl, onSelect, onClose }: SuggestionDropdownProps) {
    const theme = useTheme()
    const [selectedIndex, setSelectedIndex] = useState(0)
    const listRef = useRef<HTMLUListElement>(null)

    const filteredItems = useMemo(() => {
        if (!query) return items
        const q = query.toLowerCase()
        return items.filter((item) => item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q))
    }, [items, query])

    // Group filtered items by category
    const grouped = useMemo(() => {
        const groups: { category: string; items: SuggestionItem[] }[] = []
        const seen = new Map<string, SuggestionItem[]>()
        for (const item of filteredItems) {
            const cat = item.category ?? 'Other'
            if (!seen.has(cat)) {
                const arr: SuggestionItem[] = []
                seen.set(cat, arr)
                groups.push({ category: cat, items: arr })
            }
            seen.get(cat)!.push(item)
        }
        return groups
    }, [filteredItems])

    // Reset selection when filtered items change
    useEffect(() => {
        setSelectedIndex(0)
    }, [filteredItems.length, query])

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.querySelector('[data-selected="true"]')
            selected?.scrollIntoView?.({ block: 'nearest' })
        }
    }, [selectedIndex])

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!anchorEl || filteredItems.length === 0) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex((prev) => (prev + 1) % filteredItems.length)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length)
                    break
                case 'Enter':
                    e.preventDefault()
                    e.stopPropagation()
                    onSelect(filteredItems[selectedIndex])
                    break
                case 'Escape':
                    e.preventDefault()
                    onClose()
                    break
            }
        },
        [anchorEl, filteredItems, selectedIndex, onSelect, onClose]
    )

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown, true)
        return () => document.removeEventListener('keydown', handleKeyDown, true)
    }, [handleKeyDown])

    if (!anchorEl || filteredItems.length === 0) return null

    let flatIndex = 0

    return (
        <Popper
            open
            anchorEl={anchorEl}
            placement='bottom-start'
            style={{ zIndex: theme.zIndex.modal + 1 }}
            data-testid='suggestion-dropdown'
        >
            <Paper
                elevation={8}
                sx={{
                    maxHeight: 300,
                    width: 320,
                    overflowY: 'auto',
                    mt: 0.5
                }}
            >
                <List ref={listRef} dense disablePadding>
                    {grouped.map((group, groupIdx) => {
                        const style = CATEGORY_ICON[group.category] || DEFAULT_ICON
                        const Icon = style.icon

                        return (
                            <Box key={group.category}>
                                {groupIdx > 0 && <Divider />}
                                <Typography
                                    variant='overline'
                                    sx={{
                                        px: 2,
                                        pt: 1,
                                        pb: 0.5,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        color: theme.palette.text.secondary,
                                        fontSize: '0.65rem'
                                    }}
                                >
                                    <Icon size={14} color={style.color} />
                                    {group.category}
                                </Typography>
                                {group.items.map((item) => {
                                    const idx = flatIndex++
                                    const isSelected = idx === selectedIndex
                                    return (
                                        <ListItemButton
                                            key={item.id}
                                            data-selected={isSelected}
                                            selected={isSelected}
                                            onClick={() => onSelect(item)}
                                            sx={{ px: 2, py: 0.5 }}
                                        >
                                            <ListItemText
                                                primary={item.label}
                                                secondary={item.description}
                                                primaryTypographyProps={{ variant: 'body2', fontWeight: isSelected ? 600 : 400 }}
                                                secondaryTypographyProps={{ variant: 'caption', noWrap: true }}
                                            />
                                        </ListItemButton>
                                    )
                                })}
                            </Box>
                        )
                    })}
                </List>
            </Paper>
        </Popper>
    )
}
