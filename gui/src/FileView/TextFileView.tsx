import { FunctionComponent } from "react";

type Props = {
    content: string
}

const TextFileView: FunctionComponent<Props> = ({content}) => {
    if (!content) {
        return <div style={{color: 'red'}}>no content</div>
    }
    return (
        <div><pre>{content}</pre></div>
    )
}

export default TextFileView