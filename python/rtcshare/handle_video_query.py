import os
import io
from typing import Tuple
import cv2


def handle_video_query(query: dict, *, dir: str) -> Tuple[dict, bytes]:
    type0 = query['type']
    if type0 == 'get_video_info':
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
    elif type0 == 'get_video_frames':
        path = query['path']
        if path.startswith('$dir'):
            path = f'{dir}/{path[len("$dir"):]}'
        start_frame = query['start_frame']
        end_frame = query['end_frame']
        quality = query['quality']
        if not path.startswith('rtcshare://'):
            raise Exception(f'Invalid path: {path}')
        relpath = path[len('rtcshare://'):]
        if '..' in relpath: # for security
            raise Exception(f'Invalid path: {path}')
        fullpath = os.path.join(os.environ['RTCSHARE_DIR'], relpath)
        if not os.path.exists(fullpath):
            raise Exception(f'File does not exist: {fullpath}')
        binary_payload = get_frames_from_video_file(
            fullpath,
            start_frame=start_frame,
            end_frame=end_frame,
            quality=quality
        )
        return {'success': True}, binary_payload
    else:
        raise Exception(f'Unknown video query type: {type0}')

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