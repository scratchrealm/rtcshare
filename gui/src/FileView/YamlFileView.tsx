import { FunctionComponent, useCallback, useEffect, useState } from "react";
import { useRtcshare } from "../useRtcshare";
import YAML from 'js-yaml'
import Hyperlink from "../components/Hyperlink";
import { isFigurlYaml } from "./FigurlYaml";
import FigurlWindow from "../FigurlWindow/FigurlWindow";

type Props = {
    path: string
}

const YamlFileView: FunctionComponent<Props> = ({path}) => {
    const [content, setContent] = useState<string>()
    const [parsedContent, setParsedContent] = useState<any | undefined>()
    const [status, setStatus] = useState<'waiting' | 'loading' | 'loaded' | 'error'>('waiting')
    const [error, setError] = useState<string>('')
    const {client} = useRtcshare()

    useEffect(() => {
        if (!content) return
        try {
            const x = YAML.load(content)
            setParsedContent(x)
        }
        catch(err) {
            console.warn('Problem parsing YAML')
        }
    }, [content])

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

    const handleOpenFigurl = useCallback(() => {
        if (!parsedContent) return
        if (!isFigurlYaml(parsedContent)) return
        if (!client) return
        const w = new FigurlWindow(parsedContent, parentPathOf(path), client)
    }, [parsedContent, client, path])

    if (status === 'waiting') return <div>waiting</div>
    if (status === 'loading') return <div style={{color: 'blue'}}>loading</div>
    if (status === 'error') return <div style={{color: 'red'}}>Error: {error}</div>

    if (!content) {
        return <div style={{color: 'red'}}>no content</div>
    }
    return (
        <div>
            {
                parsedContent && isFigurlYaml(parsedContent) && (
                    <Hyperlink onClick={handleOpenFigurl}>Open figurl view</Hyperlink>
                )
            }
            <pre>{content}</pre>
        </div>
    )
}

function parentPathOf(path: string) {
    const a = path.split('/')
    return a.slice(0, a.length - 1).join('/')
}

export default YamlFileView