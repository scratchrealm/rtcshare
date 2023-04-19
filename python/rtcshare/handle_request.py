import json
from .handle_video_query import handle_video_query


def handle_request(request: dict) -> bytes:
    type0 = request['type']
    if type0 == 'serviceQuery':
        service_name = request['serviceName']
        query = request['query']
        dir = request['dir']
        if service_name == 'test':
            return json.dumps({'test': True}).encode('utf-8') + b'\n' + b'test-binary-payload'
        elif service_name == 'video':
            result, binary_payload = handle_video_query(query, dir=dir)
            return json.dumps(result).encode('utf-8') + b'\n' + binary_payload
    else:
        raise Exception(f'Unknown request type: {type0}')
    print(f'Got request: {request}')
    