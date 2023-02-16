import { FunctionComponent, useEffect, useRef, useState } from "react";
import { useRtcshare } from "../useRtcshare";
import Qjb1Client from "./Qjb1Client";

type Props = {
    path: string
    width: number
    height: number
}

const Qjb1View: FunctionComponent<Props> = ({path, width, height}) => {
    const [qjb1Client, setQjb1Client] = useState<Qjb1Client>()
    const {client: fileSystemClient} = useRtcshare()
    const [currentFrame, setCurrentFrame] = useState<number>(0)
    const canvasRef = useRef<any>(null)
	useEffect(() => {
        let canceled = false
		const ctxt: CanvasRenderingContext2D | undefined = canvasRef.current?.getContext('2d')
		if (!ctxt) return
        if (!qjb1Client) return

        // ctxt.clearRect(0, 0, ctxt.canvas.width, ctxt.canvas.height)

        ; (async () => {
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
	}, [currentFrame, qjb1Client])

    useEffect(() => {
        if (!fileSystemClient) return
        setQjb1Client(new Qjb1Client(fileSystemClient, path))
    }, [path, fileSystemClient])

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

export default Qjb1View