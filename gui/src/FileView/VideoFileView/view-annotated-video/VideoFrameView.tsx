import { getFileDataUrl } from "@figurl/interface";
import { AffineTransform } from "@figurl/spike-sorting-views";
import { FunctionComponent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props ={
	src: string
	timeSec: number | undefined
	setTimeSec: (t: number) => void
	playing: boolean
	playbackRate: number
	width: number
	height: number
	affineTransform: AffineTransform
}

const VideoFrameView: FunctionComponent<Props> = ({src, timeSec, setTimeSec, width, height, affineTransform, playing, playbackRate}) => {
	const [srcUrl, setSrcUrl] = useState<string>()
	const [seeking, setSeeking] = useState<boolean>(false)
	const [refreshCode, setRefreshCode] = useState(0)
	useEffect(() => {
		if (src.startsWith('sha1://')) {
			getFileDataUrl(src).then((url) => {
				setSrcUrl(url)
			}).catch(err => {
				console.warn(`Problem getting file data url for ${src}`)
			})
		}
		else {
			setSrcUrl(src)
		}
	}, [src])
	const canvasRef = useRef<any>(null)
	const handleDrawVideoFrame = useCallback((v: HTMLVideoElement) => {
		const ctx: CanvasRenderingContext2D | undefined = canvasRef.current?.getContext('2d')
		if (!ctx) return

		// clearRect causes a flicker
		// ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		ctx.save()
		const ff = affineTransform.forward
		ctx.transform(ff[0][0], ff[1][0], ff[0][1], ff[1][1], ff[0][2], ff[1][2])

		const W = v.videoWidth
		const H = v.videoHeight
		const W2 = W * height < H * width ? W * height / H : width
		const H2 = W * height < H * width ? height : H * width / W
		ctx.drawImage(v, (width - W2) / 2, (height - H2) / 2, W2, H2)
		
		ctx.restore()

		if (seeking) {
			ctx.strokeStyle = 'magenta'
			ctx.strokeText('Loading...', 20, 20)
		}
	}, [width, height, affineTransform, seeking])
	const video = useMemo(() => {
		if (!srcUrl) return undefined
		const v = document.createElement('video')
		v.addEventListener('seeked', (a) => {
			setSeeking(false)
			setRefreshCode(c => (c + 1))
		})
		v.src = srcUrl
		return v
	}, [srcUrl])
	useEffect(() => {
		video && handleDrawVideoFrame(video)
	}, [video, seeking, refreshCode, handleDrawVideoFrame])
	useEffect(() => {
		if (!video) return
		video.playbackRate = playbackRate
	}, [playbackRate, video])
	useEffect(() => {
		if (!video) return
		if (playing) return // avoid a loop during playing!
		if (timeSec !== undefined) {
			setSeeking(true)
			video.currentTime = timeSec || 0.0001 // for some reason it doesn't like currentTime=0 for initial display
		}
	}, [video, timeSec, playing])
	useEffect(() => {
		if (!video) return
		if (!playing) {
			video.pause()
			return
		}
		video.play()
		let canceled = false
		function drawIt() {
			if (canceled) return
			if (!video) return
			video && handleDrawVideoFrame(video)
			setTimeout(() => {
				drawIt()
				if (video) {
					setTimeSec(video.currentTime)
				}
			}, 30)
		}
		drawIt()
		return () => {canceled = true}
	}, [playing, handleDrawVideoFrame, video, setTimeSec])
	return (
		<div style={{position: 'absolute', width, height}}>
			<canvas
				ref={canvasRef}
				width={width}
				height={height}
			/>
			
		</div>
	)
}

export default VideoFrameView
