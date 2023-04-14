import axios from 'axios'

const getIceServers = async () => {
    if (process.env.RTCSHARE_METERED_APP_NAME) {
        if (!process.env.RTCSHARE_METERED_APP_KEY) {
            console.warn('WARNING: RTCSHARE_METERED_APP_KEY is not defined')
            return undefined
        }
        console.info(`Loading metered TURN server details for app ${process.env.RTCSHARE_METERED_APP_NAME}`)
        const url = `https://${process.env.RTCSHARE_METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${process.env.RTCSHARE_METERED_APP_KEY}`
        let iceServers: any | undefined
        try {
            const response = await axios.get(url)
            iceServers = response.data
        }
        catch(error) {
            console.warn('WARNING: Failed to load metered TURN server details', error)
            return undefined
        }
        console.info('Using metered TURN server')
        return iceServers
    }
    else if (process.env.RTCSHARE_METERED_APP_KEY) {
        console.warn('WARNING: RTCSHARE_METERED_APP_NAME is not defined')
        return undefined
    }
    else {
        return undefined
    }
}

export default getIceServers