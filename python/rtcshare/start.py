import os
import sys
import json
import subprocess
from threading import Thread
import signal
from pathlib import Path
import socket
from .handle_request import handle_request

this_directory = Path(__file__).parent

class Daemon:
    def __init__(self):
        self.process = None
        self.output_thread = None

    def _forward_output(self):
        while True:
            line = self.process.stdout.readline()
            sys.stdout.write(line)
            sys.stdout.flush()
            return_code = self.process.poll()
            if return_code is not None:
                print(f'Process exited with return code {return_code}')
                break
    
    def _handle_client(self, client_socket: socket.socket):
        received_data = b''
        while True:
            data0 = client_socket.recv(4)
            received_data += data0
            if data0.endswith(b'\n'):
                break
        request = json.loads(received_data.decode('utf-8'))

        # Process data received from rtcshare-js and send a response
        try:
            response_data = handle_request(request)
        except Exception as e:
            error_string = str(e)
            response_data = None
        if response_data is not None:
            client_socket.sendall(response_data)
            client_socket.close()
        else:
            client_socket.sendall(b'\n' + error_string.encode('utf-8'))
            client_socket.close()

    def start_socket_server(self) -> int:
        self.socket_server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket_server.bind(("localhost", 0))
        self.socket_server.listen(1)

        self.socket_server_thread = Thread(target=self._accept_connections, daemon=True) # daemon=True means that the thread will not block the program from exiting
        self.socket_server_thread.start()

        return self.socket_server.getsockname()[1]  # Return the port number
    
    def stop_socket_server(self):
        self.socket_server.close()
    
    def _accept_connections(self):
        while True:
            client_socket, client_address = self.socket_server.accept()
            client_thread = Thread(target=self._handle_client, args=(client_socket,), daemon=True) # daemon=True means that the thread will not block the program from exiting
            client_thread.start()

    def _handle_exit(self, signum, frame):
        print('Exiting')
        self.stop()
        sys.exit(0)

    def start(self):
        socket_server_port = self.start_socket_server()
        os.environ["RTCSHARE_SOCKET_PORT"] = str(socket_server_port)  # Pass the port number to the js server

        dir0 = os.environ.get('RTCSHARE_DIR')
        self.process = subprocess.Popen(
            # ["rtcshare", "start", "--dir", ".", "--verbose"],
            ["node", f'{this_directory}/js/dist/index.js', "start", "--dir", dir0, "--verbose"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
        )

        self.output_thread = Thread(target=self._forward_output, daemon=True) # daemon=True means that the thread will not block the program from exiting
        self.output_thread.start()

        signal.signal(signal.SIGINT, self._handle_exit)
        signal.signal(signal.SIGTERM, self._handle_exit)

    def stop(self):
        self.stop_socket_server()
        if self.process:
            self.process.terminate()
            self.process.wait()

def start(dir: str):
    os.environ['RTCSHARE_DIR'] = dir
    daemon = Daemon()
    daemon.start()

    # Don't exit until the output thread exits
    daemon.output_thread.join()