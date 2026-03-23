import type { CredentialSchemaInput } from '@/core/types'

/**
 * Returns the appropriate default value for a credential schema input based on its type.
 * If the input already defines a `default`, that value is returned as-is.
 */
export function getDefaultValueForType(input: CredentialSchemaInput): unknown {
    if (input.default !== undefined) return input.default

    switch (input.type) {
        case 'boolean':
            return false
        case 'number':
            return 0
        case 'json':
            return '{}'
        case 'options':
            return input.options?.[0]?.name ?? ''
        case 'string':
        case 'password':
        default:
            return ''
    }
}
