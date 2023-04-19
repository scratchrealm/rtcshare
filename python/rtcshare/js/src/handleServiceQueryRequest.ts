import { ServiceQueryRequest, ServiceQueryResponse } from "./RtcshareRequest"
import ServiceManager from "./ServiceManager"

const handleServiceQueryRequest = async (request: ServiceQueryRequest, serviceManager: ServiceManager): Promise<{response: ServiceQueryResponse, binaryPayload?: Buffer | undefined}> => {
    const { serviceName, query } = request
    const {result, binaryPayload} = await serviceManager.queryService(serviceName, query)
    const response: ServiceQueryResponse = {
        type: 'serviceQueryResponse',
        result
    }
    return { response, binaryPayload }
}

export default handleServiceQueryRequest