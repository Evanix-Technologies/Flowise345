import type { AxiosInstance } from 'axios'

import { bindCredentialsApi } from './credentials'

const mockClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn()
} as unknown as jest.Mocked<AxiosInstance>

beforeEach(() => {
    jest.clearAllMocks()
})

describe('bindCredentialsApi', () => {
    const api = bindCredentialsApi(mockClient)

    it('getAllCredentials calls GET /credentials', async () => {
        const mockCredentials = [{ id: '1', name: 'My OpenAI Key', credentialName: 'openAIApi' }]
        ;(mockClient.get as jest.Mock).mockResolvedValue({ data: mockCredentials })

        const result = await api.getAllCredentials()
        expect(mockClient.get).toHaveBeenCalledWith('/credentials')
        expect(result).toEqual(mockCredentials)
    })

    it('getCredentialsByName calls GET /credentials with credentialName param', async () => {
        const mockCredentials = [{ id: '1', name: 'My OpenAI Key', credentialName: 'openAIApi' }]
        ;(mockClient.get as jest.Mock).mockResolvedValue({ data: mockCredentials })

        const result = await api.getCredentialsByName('openAIApi')
        expect(mockClient.get).toHaveBeenCalledWith('/credentials', { params: { credentialName: 'openAIApi' } })
        expect(result).toEqual(mockCredentials)
    })

    it('getComponentCredentialSchema calls GET /components-credentials/:name', async () => {
        const mockSchema = { name: 'openAIApi', label: 'OpenAI API', inputs: [] }
        ;(mockClient.get as jest.Mock).mockResolvedValue({ data: mockSchema })

        const result = await api.getComponentCredentialSchema('openAIApi')
        expect(mockClient.get).toHaveBeenCalledWith('/components-credentials/openAIApi')
        expect(result).toEqual(mockSchema)
    })

    it('createCredential calls POST /credentials with body', async () => {
        const body = { name: 'My New Key', credentialName: 'openAIApi', plainDataObj: { apiKey: 'sk-test' } }
        const mockCreated = { id: '2', ...body }
        ;(mockClient.post as jest.Mock).mockResolvedValue({ data: mockCreated })

        const result = await api.createCredential(body)
        expect(mockClient.post).toHaveBeenCalledWith('/credentials', body)
        expect(result).toEqual(mockCreated)
    })

    it('getCredentialById calls GET /credentials/:id', async () => {
        const mockCredential = { id: 'cred-1', name: 'My Key', credentialName: 'openAIApi', plainDataObj: { apiKey: 'sk-test' } }
        ;(mockClient.get as jest.Mock).mockResolvedValue({ data: mockCredential })

        const result = await api.getCredentialById('cred-1')
        expect(mockClient.get).toHaveBeenCalledWith('/credentials/cred-1')
        expect(result).toEqual(mockCredential)
    })

    it('updateCredential calls PUT /credentials/:id with body', async () => {
        const body = { name: 'Updated Key', credentialName: 'openAIApi', plainDataObj: { apiKey: 'sk-new' } }
        const mockUpdated = { id: 'cred-1', ...body }
        ;(mockClient.put as jest.Mock).mockResolvedValue({ data: mockUpdated })

        const result = await api.updateCredential('cred-1', body)
        expect(mockClient.put).toHaveBeenCalledWith('/credentials/cred-1', body)
        expect(result).toEqual(mockUpdated)
    })
})
