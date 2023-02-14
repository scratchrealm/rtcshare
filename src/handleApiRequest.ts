import DirManager from "./DirManager";
import { ReadDirRequest, ReadDirResponse, RtcshareRequest, RtcshareResponse, ProbeResponse, protocolVersion } from "./RtcshareRequest";
import SignalCommunicator from "./SignalCommunicator";

export const handleApiRequest = async (request: RtcshareRequest, dirManager: DirManager, signalCommunicator: SignalCommunicator, o: {verbose: boolean, webrtc?: boolean, proxy?: boolean}): Promise<RtcshareResponse> => {
    if (request.type === 'ProbeRequest') {
        const response: ProbeResponse = {
            type: 'ProbeResponse',
            protocolVersion: protocolVersion
        }
        if (o.proxy) {
            response.proxy = true
        }
        return response
    }
    else if (request.type === 'ReadDirRequest') {
        if (o.verbose) {
            console.info(`${o.webrtc ? "Webrtc " : ""}ReadDir`)
        }
        const {dirs, files} = await dirManager.readDir(request.path)
        const response: ReadDirResponse = {type: 'ReadDirResponse', files, dirs}
        return response
    }
    else if (request.type === 'webrtcSignalingRequest') {
        if (o.verbose) {
            console.info(`${o.webrtc ? "Webrtc " : ""}webrtcSignalingRequest`)
        }
        return await signalCommunicator.handleRequest(request)
    }
    else {
        throw Error('Unexpected request type')
    }
}