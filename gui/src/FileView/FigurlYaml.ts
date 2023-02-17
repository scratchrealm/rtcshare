import validateObject, { isEqualTo, isOneOf, isString, optional } from "../validateObject"

type FigurlYaml = {
    type: 'figurl'
    v: string
    d: string | any
    label?: string
}

export const isFigurlYaml = (x: any): x is FigurlYaml => (
    validateObject(x, {
        type: isEqualTo('figurl'),
        v: isString,
        d: isOneOf([isString, () => (true)]),
        label: optional(isString)
    })
)

export default FigurlYaml