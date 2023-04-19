import YAML from 'js-yaml';
import { FunctionComponent, useCallback, useEffect, useState } from "react";
import Hyperlink from "../components/Hyperlink";
import { serviceBaseUrl } from "../config";
import { isFigurlYaml } from "./FigurlYaml";

type Props = {
    content: string
    path: string
}

const YamlFileView: FunctionComponent<Props> = ({path, content}) => {
    const [parsedContent, setParsedContent] = useState<any | undefined>()

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

    const handleOpenFigurl = useCallback(() => {
        if (!parsedContent) return
        if (!isFigurlYaml(parsedContent)) return
        const baseDir = parentPathOf(path)
        let url = `http://figurl.org/f?v=${parsedContent.v}`
        if (parsedContent.d) {
            url += `&d=${parsedContent.d}`
        }
        if (parsedContent.label) {
            url += `&label=${encodeURIComponent(parsedContent.label)}`
        }
        url += `&sh=${serviceBaseUrl}`
        url += `&dir=rtcshare://${baseDir}`
        window.open(url, '_blank')
    }, [parsedContent, path])

    if (!content) {
        return <div style={{color: 'red'}}>no content</div>
    }
    return (
        <div>
            {
                parsedContent && isFigurlYaml(parsedContent) && (
                    <div>
                        <Hyperlink onClick={handleOpenFigurl}>Open figurl</Hyperlink>
                    </div>
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