export const mergeAttributes = jest.fn((...attrs: Record<string, unknown>[]) => Object.assign({}, ...attrs))

export class PasteRule {
    constructor(public config: Record<string, unknown>) {}
}
