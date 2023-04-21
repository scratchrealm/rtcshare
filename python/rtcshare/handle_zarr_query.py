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
        name = query['name']
        slices = query['slices']
        slice_objects = to_slice_objects(slices)

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
        zarr_array_slices = zarr_array[slice_objects]
        numpy_array = zarr_array_slices[:]
        result = {
            'dtype': str(numpy_array.dtype),
        }
        # ensure we have c order
        if not numpy_array.flags.c_contiguous:
            numpy_array = numpy_array.copy(order='C')
        return result, numpy_array.tobytes()
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

def get_video_info(path: str) -> dict:
    print(f'Getting video info from {path}')
    
    # Open the video file
    cap = cv2.VideoCapture(path)
    
    # Get the video info
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Release the video capture object
    cap.release()
    
    # Return the video info
    return {
        'width': width,
        'height': height,
        'fps': fps,
        'frame_count': frame_count
    }

def get_frames_from_video_file(path: str, *, start_frame: int, end_frame: int, quality: int) -> bytes:
    print(f'Getting frames from {path} ({start_frame} - {end_frame})')

    # Open the video file
    cap = cv2.VideoCapture(path)

    # Validate frame range
    if start_frame < 0 or end_frame > int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or start_frame >= end_frame:
        raise ValueError("Invalid frame range")
    
    # Set the starting frame
    cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
    
    # Initialize a list to hold the JPG blobs
    jpg_blobs = []
    
    # Loop through the specified frames
    for i in range(start_frame, end_frame):
        # Read the frame
        ret, frame = cap.read()
        if not ret:
            break
        
        # Convert the frame to JPG
        # Encode frame to JPG with the specified quality
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        if not ret:
            raise RuntimeError("Failed to encode frame as JPG")
        
        # Append the JPG blob to the list
        jpg_blobs.append(buffer)
    
    # Release the video capture object
    cap.release()
    
    # Concatenate the JPG blobs into one binary output
    return b''.join(jpg_blobs)