import os
import zarr
from typing import Tuple


def handle_zarr_query(query: dict, *, dir: str) -> Tuple[dict, bytes]:
    type0 = query['type']
    if type0 == 'get_array_chunk' or type0 == 'get_array_info':
        try:
            path = query['path']
            if path.startswith('$dir'):
                path = f'{dir}/{path[len("$dir"):]}'
            name = query['name']

            if not path.startswith('rtcshare://'):
                raise Exception(f'Invalid path: {path}')
            relpath = path[len('rtcshare://'):]
            if '..' in relpath: # for security
                raise Exception(f'Invalid path: {path}')
            fullpath = os.path.join(os.environ['RTCSHARE_DIR'], relpath)
            if not os.path.exists(fullpath):
                raise Exception(f'Folder does not exist: {fullpath}')
            root_group = zarr.open(fullpath, 'r')
            zarr_array = root_group[name]
            result = {
                'success': True,
                'dtype': str(zarr_array.dtype),
                'shape': [int(x) for x in zarr_array.shape]
            }

            if type0 == 'get_array_info':
                return result, b''
            elif type0 == 'get_array_chunk':
                slices = query['slices']
                slice_objects = to_slice_objects(slices)
                zarr_array_slices = zarr_array[slice_objects]
                numpy_array = zarr_array_slices[:]
                
                # ensure we have c order
                if not numpy_array.flags.c_contiguous:
                    numpy_array = numpy_array.copy(order='C')
                return result, numpy_array.tobytes()
            else:
                raise Exception(f'Unexpected zarr query type: {type0}')
        except Exception as e:
            print(f'Error while handling zarr query: {e}')
            return {'success': False, 'error': str(e)}, b''
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