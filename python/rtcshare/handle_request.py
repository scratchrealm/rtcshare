import json
from .handle_video_query import handle_video_query
from .handle_zarr_query import handle_zarr_query
from .RtcshareContext import RtcshareContext


def handle_request(request: dict, context: RtcshareContext) -> bytes:
    type0 = request['type']
    if type0 == 'serviceQuery':
        service_name = request['serviceName']
        query = request['query']
        dir = request['dir']
        user_id = request.get('userId', None)
        print(f'Got service query: {service_name}')
        try:
            if service_name == 'test':
                return json.dumps({'test_query': query}).encode('utf-8') + b'\n' + b'test-binary-payload'
            elif service_name == 'video':
                result, binary_payload = handle_video_query(query, dir=dir)
                return json.dumps(result).encode('utf-8') + b'\n' + binary_payload
            elif service_name == 'zarr':
                result, binary_payload = handle_zarr_query(query, dir=dir)
                return json.dumps(result).encode('utf-8') + b'\n' + binary_payload
            else:
                result, binary_payload = context.handle_query(service_name, query, dir=dir, user_id=user_id)
                return json.dumps(result).encode('utf-8') + b'\n' + binary_payload
        except Exception as e:
            print(f'Error while handling service query: {e}')
            return b'\n' + str(e).encode('utf-8')
    else:
        raise Exception(f'Unknown request type: {type0}')
    