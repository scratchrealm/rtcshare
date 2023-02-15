import { FunctionComponent, useEffect, useState } from "react";
import FileBrowser from "../FileBrowser/FileBrowser";
import { RtcshareDir } from "../RtcshareRequest";
import { useRtcshare } from "../useRtcshare";

type Props = any

const Home: FunctionComponent<Props> = () => {
    const {client} = useRtcshare()
    const [dir, setDir] = useState<RtcshareDir>()
    useEffect(() => {
        if (!client) return
        ;(async () => {
            const d = await client.readDir('')
            setDir(d)
        })()
    }, [client])
    return <div>
        <div style={{position: 'relative', width: 500, height: 500}}>
            <FileBrowser />
        </div>
        <pre>{JSON.stringify(dir, null, 4)}</pre>
    </div>
}

export default Home