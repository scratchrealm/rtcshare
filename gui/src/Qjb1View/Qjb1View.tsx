import { ThemeProvider } from "@emotion/react";
import { PlayArrow, Stop } from "@mui/icons-material";
import { createTheme, FormControl, IconButton, MenuItem, Select, SelectChangeEvent, Slider } from "@mui/material";
import { FunctionComponent, useCallback, useEffect, useRef, useState } from "react";
import { useRtcshare } from "../useRtcshare";
import Qjb1Client from "./Qjb1Client";
import Qjb1ViewCanvas from "./Qjb1ViewCanvas";

type Props = {
    path: string
    width: number
    height: number
}

const theme = createTheme({
	components: {
		MuiSlider: {
			styleOverrides: {
				root: {
					paddingTop: 25,
					marginLeft: 10
				}	
			}
		}
	}
})

const bottomBarHeight = 50

const Qjb1View: FunctionComponent<Props> = ({path, width, height}) => {
    const [qjb1Client, setQjb1Client] = useState<Qjb1Client>()
    const {client: fileSystemClient} = useRtcshare()

    const [currentTime, setCurrentTime] = useState<number>(0)

    useEffect(() => {
        if (!fileSystemClient) return
        setQjb1Client(new Qjb1Client(fileSystemClient, path))
    }, [path, fileSystemClient])

    const [playing, setPlaying] = useState<boolean>(false)
	const [playbackRate, setPlaybackRate] = useState<number>(1)
	const handlePlay = useCallback(() => {
		setPlaying(true)
	}, [])
	const handleStop = useCallback(() => {
		setPlaying(false)
	}, [])
	const currentTimeRef = useRef<number>(currentTime || 0)
	useEffect(() => {
		currentTimeRef.current = currentTime || 0
	}, [currentTime])
	useEffect(() => {
		if (!playing) return
		let canceled = false
		const startTime = currentTimeRef.current
		const timer = Date.now()
		let rr = 0
		const update = () => {
			const elapsed = (Date.now() - timer) / 1000
			setCurrentTime(startTime + elapsed * playbackRate)
			setTimeout(() => { // apparently it's important to use a small timeout here so the controls still work (e.g., the slider)
				if (canceled) return
				rr = requestAnimationFrame(update)
			}, 10)
		}
		rr = requestAnimationFrame(update)
		return () => {cancelAnimationFrame(rr); canceled = true}
	}, [playing, setCurrentTime, playbackRate])

    const videoStartTime = 0
    const videoHeader = qjb1Client?.header()
    const videoEndTime = videoHeader ? videoHeader.num_frames / videoHeader.frames_per_second : 0

    const height2 = height - bottomBarHeight

    return (
        <div style={{position: 'absolute', width, height}}>
            {
                qjb1Client && (
                    <Qjb1ViewCanvas
                        width={width}
                        height={height2}
                        qjb1Client={qjb1Client}
                        currentTime={currentTime}
                    />
                )
            }
            <ThemeProvider theme={theme}>
                <div style={{position: 'absolute', width, height: bottomBarHeight, top: height2}}>
                    {!playing && <IconButton title="Play video" disabled={playing} onClick={handlePlay}><PlayArrow /></IconButton>}
                    {playing && <IconButton title="Stop video" disabled={!playing} onClick={handleStop}><Stop /></IconButton>}
                    <PlaybackRateControl playbackRate={playbackRate} setPlaybackRate={setPlaybackRate} />
                    &nbsp;
                    <FormControl size="small">
                        <Slider
                            min={videoStartTime}
                            max={videoEndTime}
                            step={1}
                            style={{width: 300}}
                            value={currentTime || 0}
                            onChange={(e, v) => {setCurrentTime(v as number)}}
                            disabled={playing}
                        />
                    </FormControl>
                </div>
            </ThemeProvider>
		</div>
    )
}

const PlaybackRateControl: FunctionComponent<{playbackRate: number, setPlaybackRate: (x: number) => void}> = ({playbackRate, setPlaybackRate}) => {
	const handleChange = useCallback((e: SelectChangeEvent) => {
		setPlaybackRate(parseFloat(e.target.value))
	}, [setPlaybackRate])
	return (
		<FormControl size="small">
			<Select onChange={handleChange} value={playbackRate + ''}>
				<MenuItem key={0.1} value={0.1}>0.1x</MenuItem>
				<MenuItem key={0.25} value={0.25}>0.25x</MenuItem>
				<MenuItem key={0.5} value={0.5}>0.5x</MenuItem>
				<MenuItem key={1} value={1}>1x</MenuItem>
				<MenuItem key={2} value={2}>2x</MenuItem>
				<MenuItem key={4} value={4}>4x</MenuItem>
				<MenuItem key={8} value={8}>8x</MenuItem>
			</Select>
		</FormControl>
	)
}

export default Qjb1View