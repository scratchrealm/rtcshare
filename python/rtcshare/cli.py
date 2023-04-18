import click
from .start import start as start_function

@click.group()
def rtcshare():
    pass

@click.command()
@click.option('--dir', required=True, help='The directory to share.')
def start(dir: str):
    start_function(dir)

# Add the start command to the rtcshare group
rtcshare.add_command(start)

if __name__ == '__main__':
    rtcshare()