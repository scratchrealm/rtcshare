import { getFileData } from "@figurl/interface"
import { useTimeseriesSelection, useTimeseriesSelectionInitialization } from "@figurl/timeseries-views"
import { FunctionComponent, useEffect, useState } from "react"
import { AnnotatedVideoNode, AnnotatedVideoViewData } from "./AnnotatedVideoViewData"
import AnnotatedVideoWidget from "./AnnotatedVideoWidget"

type Props = {
	data: AnnotatedVideoViewData
	width: number
	height: number
}

const AnnotatedVideoView: FunctionComponent<Props> = ({data, width, height}) => {
	const {samplingFrequency, videoUri, videoWidth, videoHeight, videoNumFrames, annotationsUri, nodesUri, positionDecodeFieldUri} = data
    const {currentTime, setCurrentTime} = useTimeseriesSelection()
    useTimeseriesSelectionInitialization(0, videoNumFrames / samplingFrequency)
    useEffect(() => {
        if (currentTime === undefined) {
            setTimeout(() => setCurrentTime(0), 1) // for some reason we need to use setTimeout for initialization - probably because we are waiting for useTimeseriesSelectionInitialization
        }
    }, [currentTime, setCurrentTime])
    const [nodes, setNodes] = useState<AnnotatedVideoNode[]>()
    useEffect(() => {
        if (!nodesUri) return
        getFileData(nodesUri, () => {}, {responseType: 'json'}).then(x => {
            setNodes(x)
        })
    }, [nodesUri])
	return (
        <AnnotatedVideoWidget
            width={width}
            height={height}
            videoUri={videoUri}
            annotationsUri={annotationsUri}
            nodes={nodes}
            positionDecodeFieldUri={positionDecodeFieldUri}
            videoWidth={videoWidth}
            videoHeight={videoHeight}
            videoNumFrames={videoNumFrames}
            samplingFrequency={samplingFrequency}
        />
    )
}

export default AnnotatedVideoView
