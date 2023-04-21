import json
from .handle_video_query import handle_video_query
from .handle_zarr_query import handle_zarr_query


def handle_request(request: dict) -> bytes:
    type0 = request['type']
    if type0 == 'serviceQuery':
        service_name = request['serviceName']
        query = request['query']
        dir = request['dir']
        print(f'Got service query: {service_name}')
        try:
            if service_name == 'test':
                return json.dumps({'test': True}).encode('utf-8') + b'\n' + b'test-binary-payload'
            elif service_name == 'video':
                result, binary_payload = handle_video_query(query, dir=dir)
                return json.dumps(result).encode('utf-8') + b'\n' + binary_payload
            elif service_name == 'audio':
                result, binary_payload = handle_zarr_query(query, dir=dir)
                return json.dumps(result).encode('utf-8') + b'\n' + binary_payload
            else:
                raise Exception(f'No such service: {service_name}')
        except Exception as e:
            print(f'Error while handling service query: {e}')
            return b'\n' + str(e).encode('utf-8')
    else:
        raise Exception(f'Unknown request type: {type0}')
    