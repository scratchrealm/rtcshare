import { FunctionComponent, useEffect, useState } from "react";
import { useRtcshare } from "../useRtcshare";

type Props = {
    path: string
}

const TextFileView: FunctionComponent<Props> = ({path}) => {
    const [content, setContent] = useState<string>()
    const [status, setStatus] = useState<'waiting' | 'loading' | 'loaded' | 'error'>('waiting')
    const [error, setError] = useState<string>('')
    const {client} = useRtcshare()

    useEffect(() => {
        if (!client) return
        setStatus('loading')
        let canceled = false
        ; (async () => {
            try {
                const x = await client.readFile(path)
                if (canceled) return
                const dec = new TextDecoder()
                setContent(dec.decode(x))
                setStatus('loaded')
            }
            catch(err: any) {
                if (canceled) return
                setStatus('error')
                setError(err.message)
            }
        })()
        return () => {canceled = true}
    }, [path, client])

    if (status === 'waiting') return <div>waiting</div>
    if (status === 'loading') return <div style={{color: 'blue'}}>loading</div>
    if (status === 'error') return <div style={{color: 'red'}}>Error: {error}</div>

    if (!content) {
        return <div style={{color: 'red'}}>no content</div>
    }
    return (
        <div><pre>{content}</pre></div>
    )
}

export default TextFileView