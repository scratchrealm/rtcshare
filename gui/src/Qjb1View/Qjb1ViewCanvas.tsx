import { FunctionComponent, useEffect, useRef } from "react";
import Qjb1Client from "./Qjb1Client";

type Props = {
    qjb1Client: Qjb1Client
    currentTime: number
    width: number
    height: number
}

const Qjb1ViewCanvas: FunctionComponent<Props> = ({qjb1Client, currentTime, width, height}) => {
    const canvasRef = useRef<any>(null)
	useEffect(() => {
        let canceled = false
		const ctxt: CanvasRenderingContext2D | undefined = canvasRef.current?.getContext('2d')
		if (!ctxt) return
        if (!qjb1Client) return

        // ctxt.clearRect(0, 0, ctxt.canvas.width, ctxt.canvas.height)

        ; (async () => {
            await qjb1Client.initialize()
            if (canceled) return
            const header = qjb1Client.header()
            if (!header) return
            const fps = header.frames_per_second
            const currentFrame = Math.round(currentTime * fps)
            const frameImage = await qjb1Client.getFrameImage(currentFrame)
            if (canceled) return
            if (!frameImage) return
            const b64 = arrayBufferToBase64(frameImage)
            const dataUrl = `data:image/jpeg;base64,${b64}`

            const img = new Image
            img.onload = () => {
                if (canceled) return
                ctxt.drawImage(img, 0, 0)
            }
            img.src = dataUrl;
        })()
        return () => {canceled = true}
	}, [currentTime, qjb1Client])

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

function arrayBufferToBase64( buffer: ArrayBuffer ) {
    let binary = '';
    const bytes = new Uint8Array( buffer );
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

export default Qjb1ViewCanvas