import WebrtcConnectionToService from "./WebrtcConnectionToService"

const urlSearchParams = new URLSearchParams(window.location.search)
const queryParams = Object.fromEntries(urlSearchParams.entries())

export const defaultServiceBaseUrl = 'http://localhost:61752'

export const serviceBaseUrl = queryParams.s ? (
    queryParams.s
) : (
    defaultServiceBaseUrl
)

export const useWebrtc = queryParams.webrtc === '1'

export let webrtcConnectionToService: WebrtcConnectionToService | undefined

if ((useWebrtc) && (!webrtcConnectionToService)) {
    webrtcConnectionToService = new WebrtcConnectionToService()
}