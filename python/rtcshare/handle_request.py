import json


def handle_request(request: dict) -> bytes:
    print(f'Got request: {request}')
    return json.dumps({'test': True}).encode('utf-8') + b'\n' + b'test-binary-payload'