import { useCallback, useEffect, useState } from 'react'

import { Info } from '@mui/icons-material'
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
    IconButton,
    MenuItem,
    OutlinedInput,
    Select,
    Switch,
    Tooltip,
    Typography
} from '@mui/material'
import parser from 'html-react-parser'

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
    const { credentialsApi, apiBaseUrl } = useApiContext()

    const [schemas, setSchemas] = useState<ComponentCredentialSchema[]>([])
    const [selectedSchema, setSelectedSchema] = useState<ComponentCredentialSchema | null>(null)
    const [credentialName, setCredentialName] = useState('')
    const [formValues, setFormValues] = useState<Record<string, unknown>>({})
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const selectSchema = useCallback((schema: ComponentCredentialSchema) => {
        setSelectedSchema(schema)
        setCredentialName('')
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
            <DialogTitle sx={{ fontSize: '1rem' }}>
                {selectedSchema ? (
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <div
                            style={{
                                width: 50,
                                height: 50,
                                marginRight: 10,
                                borderRadius: '50%',
                                backgroundColor: 'white'
                            }}
                        >
                            <img
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: 7,
                                    borderRadius: '50%',
                                    objectFit: 'contain'
                                }}
                                alt={selectedSchema.name}
                                src={`${apiBaseUrl}/api/v1/components-credentials-icon/${selectedSchema.name}`}
                            />
                        </div>
                        {selectedSchema.label}
                    </div>
                ) : (
                    'Select Credential Type'
                )}
            </DialogTitle>
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
                    <>
                        {selectedSchema.description && (
                            <Box sx={{ pl: 2, pr: 2 }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        borderRadius: 10,
                                        background: 'rgb(254,252,191)',
                                        padding: 10,
                                        marginTop: 10,
                                        marginBottom: 10
                                    }}
                                >
                                    <span style={{ color: 'rgb(116,66,16)' }}>{parser(selectedSchema.description)}</span>
                                </div>
                            </Box>
                        )}

                        <Box sx={{ p: 2 }}>
                            <Typography variant='overline'>
                                Credential Name
                                <span style={{ color: 'red' }}>&nbsp;*</span>
                            </Typography>
                            <OutlinedInput
                                fullWidth
                                type='string'
                                placeholder={selectedSchema.label}
                                value={credentialName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredentialName(e.target.value)}
                                autoFocus
                            />
                        </Box>

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
                    </>
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
        <Typography>
            {input.label}
            {!input.optional && <span style={{ color: 'red' }}>&nbsp;*</span>}
            {input.description && (
                <Tooltip title={parser(input.description)} placement='right'>
                    <IconButton sx={{ height: 15, width: 15, ml: 1, mt: -0.5 }}>
                        <Info sx={{ height: 15, width: 15 }} />
                    </IconButton>
                </Tooltip>
            )}
        </Typography>
    )

    if (input.type === 'boolean') {
        return (
            <Box sx={{ p: 2 }}>
                <FormControlLabel
                    control={<Switch checked={Boolean(value)} onChange={(_e, checked) => onChange(checked)} />}
                    label={label}
                />
            </Box>
        )
    }

    if (input.type === 'options' && input.options) {
        return (
            <Box sx={{ p: 2 }}>
                {label}
                <Select fullWidth value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
                    {input.options.map((opt) => (
                        <MenuItem key={opt.name} value={opt.name}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            </Box>
        )
    }

    return (
        <Box sx={{ p: 2 }}>
            {label}
            <OutlinedInput
                fullWidth
                type={input.type === 'password' ? 'password' : input.type === 'number' ? 'number' : 'text'}
                multiline={input.type === 'json'}
                rows={input.type === 'json' ? 4 : undefined}
                placeholder={input.placeholder}
                value={(value as string) ?? ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            />
        </Box>
    )
}
