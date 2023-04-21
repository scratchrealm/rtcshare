import os
import zarr
from typing import Tuple
import cv2


def handle_zarr_query(query: dict, *, dir: str) -> Tuple[dict, bytes]:
    type0 = query['type']
    if type0 == 'get_array_chunk':
        path = query['path']
        if path.startswith('$dir'):
            path = f'{dir}/{path[len("$dir"):]}'
        if not path.startswith('rtcshare://'):
            raise Exception(f'Invalid path: {path}')
        relpath = path[len('rtcshare://'):]
        if '..' in relpath: # for security
            raise Exception(f'Invalid path: {path}')
        fullpath = os.path.join(os.environ['RTCSHARE_DIR'], relpath)
        if not os.path.exists(fullpath):
            raise Exception(f'File does not exist: {fullpath}')
        info = get_video_info(fullpath)
        return {'info': info}, b''
    else:
        raise Exception(f'Unknown video query type: {type0}')

def to_slice_objects(x: list[dict]):
    # Initialize an empty list to store the slice objects
    slice_objects = []

    # Iterate through the list of dictionaries
    for d in x:
        # Create a slice object from the dictionary values
        s = slice(d['start'], d['stop'], d['step'])

        # Append the slice object to the list of slice objects
        slice_objects.append(s)

    # Return the tuple of slice objects
    return tuple(slice_objects)