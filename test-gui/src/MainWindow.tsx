import { FunctionComponent, useEffect } from "react";
import { defaultServiceBaseUrl, serviceBaseUrl, useWebrtc } from "./config";
import Home from "./pages/Home";
import useRoute from "./useRoute";
import { useRtcshare } from "./useRtcshare";

type Props = any

const MainWindow: FunctionComponent<Props> = () => {
	const { route } = useRoute()

	const {connectedToService, webrtcConnectionStatus} = useRtcshare()

	if (webrtcConnectionStatus === 'error') {
		return (
			<div>Unable to connect to service using WebRTC: {serviceBaseUrl}</div>
		)
	}

	if (connectedToService === undefined) {
		return (
			<div>Connecting to service{useWebrtc ? ' using WebRTC' : ''}: {serviceBaseUrl}</div>
		)
	}

	if (connectedToService === false) {
		return (
			<div style={{margin: 60}}>
				<div style={{color: 'darkred'}}>Not connected to service {serviceBaseUrl}</div>
				{
					serviceBaseUrl === defaultServiceBaseUrl && (
						<p><a href="https://github.com/scratchrealm/rtcshare" target="_blank" rel="noreferrer">How to run a local service</a></p>
					)
				}
			</div>
		)
	}

	return (
		<div>
			{
				route.page === 'home' ? (
					<Home />
				) : <span />
			}
		</div>
	)
}

export default MainWindow
