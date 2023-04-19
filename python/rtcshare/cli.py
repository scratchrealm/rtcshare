import click
from .start import start as start_function

@click.group()
def rtcshare():
    pass

@click.command()
@click.option('--dir', required=True, help='The directory to share.')
@click.option('--enable-remote-access', is_flag=True, help='Enable remote access.')
def start(dir: str, enable_remote_access: bool):
    start_function(dir, enable_remote_access=enable_remote_access)

# Add the start command to the rtcshare group
rtcshare.add_command(start)

if __name__ == '__main__':
    rtcshare()