const createMessageWithBinaryPayload = (m: any, binaryPayload?: Buffer | ArrayBuffer | undefined): ArrayBuffer => {
    if (binaryPayload) {
        if (binaryPayload instanceof Buffer) {
            const mm = Buffer.concat([
                Buffer.from(JSON.stringify(m) + '\n', 'utf-8'),
                binaryPayload
            ])
            return bufferToArrayBuffer(mm)
        }
        else if (binaryPayload instanceof ArrayBuffer) {
            const enc = new TextEncoder()
            const mm = concatArrayBuffers(
                enc.encode(JSON.stringify(m) + '\n').buffer,
                binaryPayload
            )
            return mm
        }
    }
    else {
        const enc = new TextEncoder()
        return enc.encode(JSON.stringify(m)).buffer
    }
}

function bufferToArrayBuffer(buffer: Buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

function concatArrayBuffers(b1: ArrayBuffer, b2: ArrayBuffer) {
    const tmp = new Uint8Array(b1.byteLength + b2.byteLength)
    tmp.set(new Uint8Array(b1), 0)
    tmp.set(new Uint8Array(b2), b1.byteLength)
    return tmp.buffer

}

export default createMessageWithBinaryPayload