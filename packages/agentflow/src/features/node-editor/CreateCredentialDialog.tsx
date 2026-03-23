import { useCallback, useEffect, useState } from 'react'

import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from '@mui/material'

import type { ComponentCredentialSchema, CredentialSchemaInput } from '@/core/types'
import { getDefaultValueForType } from '@/core/utils/credentialDefaults'
import { useApiContext } from '@/infrastructure/store/ApiContext'

export interface CreateCredentialDialogProps {
    open: boolean
    credentialNames: string[]
    onClose: () => void
    onCreated: (credentialId: string) => void
}

/**
 * Dialog for creating a new credential from within the node editor.
 * Fetches the credential schema from the backend and renders a dynamic form.
 */
export function CreateCredentialDialog({ open, credentialNames, onClose, onCreated }: CreateCredentialDialogProps) {
    const { credentialsApi } = useApiContext()

    const [schemas, setSchemas] = useState<ComponentCredentialSchema[]>([])
    const [selectedSchema, setSelectedSchema] = useState<ComponentCredentialSchema | null>(null)
    const [credentialName, setCredentialName] = useState('')
    const [formValues, setFormValues] = useState<Record<string, unknown>>({})
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const selectSchema = useCallback((schema: ComponentCredentialSchema) => {
        setSelectedSchema(schema)
        setCredentialName(schema.label ?? '')
        // Initialize default values for each input
        const defaults: Record<string, unknown> = {}
        for (const input of schema.inputs ?? []) {
            if (input.hidden) continue
            defaults[input.name] = getDefaultValueForType(input)
        }
        setFormValues(defaults)
    }, [])

    // Fetch credential schema(s) when dialog opens
    useEffect(() => {
        if (!open) return

        let cancelled = false

        async function fetchSchemas() {
            setLoading(true)
            setError(null)
            setSchemas([])
            setSelectedSchema(null)
            setCredentialName('')
            setFormValues({})

            try {
                if (credentialNames.length === 1) {
                    const schema = await credentialsApi.getComponentCredentialSchema(credentialNames[0])
                    if (!cancelled) {
                        setSchemas([schema])
                        selectSchema(schema)
                    }
                } else {
                    // Fetch each schema individually
                    const results = await Promise.all(credentialNames.map((name) => credentialsApi.getComponentCredentialSchema(name)))
                    if (!cancelled) {
                        setSchemas(results)
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Failed to load credential schema')
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        fetchSchemas()

        return () => {
            cancelled = true
        }
    }, [open, credentialNames, credentialsApi, selectSchema])

    const handleFieldChange = useCallback((fieldName: string, value: unknown) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }))
    }, [])

    const handleSubmit = useCallback(async () => {
        if (!selectedSchema || !credentialName.trim()) return

        setSubmitting(true)
        setError(null)

        try {
            const result = await credentialsApi.createCredential({
                name: credentialName.trim(),
                credentialName: selectedSchema.name,
                plainDataObj: formValues
            })
            onCreated(result.id)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create credential')
        } finally {
            setSubmitting(false)
        }
    }, [selectedSchema, credentialName, formValues, credentialsApi, onCreated])

    const handleClose = useCallback(() => {
        if (!submitting) onClose()
    }, [submitting, onClose])

    // Schema selection step (multiple credential types)
    const showSelection = !loading && !selectedSchema && schemas.length > 1

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
            <DialogTitle>{selectedSchema ? selectedSchema.label : 'Select Credential Type'}</DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity='error' sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {showSelection && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {schemas.map((schema) => (
                            <Button
                                key={schema.name}
                                variant='outlined'
                                onClick={() => selectSchema(schema)}
                                sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                            >
                                {schema.label}
                            </Button>
                        ))}
                    </Box>
                )}

                {selectedSchema && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {selectedSchema.description && (
                            <Alert severity='info' sx={{ mb: 1 }}>
                                {selectedSchema.description}
                            </Alert>
                        )}

                        <TextField
                            label='Credential Name'
                            required
                            fullWidth
                            size='small'
                            value={credentialName}
                            onChange={(e) => setCredentialName(e.target.value)}
                            autoFocus
                        />

                        {(selectedSchema.inputs ?? [])
                            .filter((input) => !input.hidden)
                            .map((input) => (
                                <CredentialField
                                    key={input.name}
                                    input={input}
                                    value={formValues[input.name]}
                                    onChange={(value) => handleFieldChange(input.name, value)}
                                />
                            ))}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={submitting}>
                    Cancel
                </Button>
                {selectedSchema && (
                    <Button variant='contained' onClick={handleSubmit} disabled={!credentialName.trim() || submitting}>
                        {submitting ? 'Adding...' : 'Add'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

// ---------------------------------------------------------------------------
// Dynamic form field renderer
// ---------------------------------------------------------------------------

interface CredentialFieldProps {
    input: CredentialSchemaInput
    value: unknown
    onChange: (value: unknown) => void
}

function CredentialField({ input, value, onChange }: CredentialFieldProps) {
    const label = (
        <>
            {input.label}
            {!input.optional && <span style={{ color: 'red' }}> *</span>}
        </>
    )

    if (input.type === 'boolean') {
        return (
            <FormControlLabel
                control={<Switch checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />}
                label={<Typography variant='body2'>{label}</Typography>}
            />
        )
    }

    if (input.type === 'options' && input.options) {
        return (
            <Box>
                <Typography variant='body2' sx={{ mb: 0.5 }}>
                    {label}
                </Typography>
                <Select fullWidth size='small' value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
                    {input.options.map((opt) => (
                        <MenuItem key={opt.name} value={opt.name}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
                {input.description && (
                    <Typography variant='caption' color='text.secondary'>
                        {input.description}
                    </Typography>
                )}
            </Box>
        )
    }

    return (
        <TextField
            fullWidth
            size='small'
            label={label}
            type={input.type === 'password' ? 'password' : input.type === 'number' ? 'number' : 'text'}
            multiline={input.type === 'json'}
            rows={input.type === 'json' ? 4 : undefined}
            placeholder={input.placeholder}
            helperText={input.description}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}
