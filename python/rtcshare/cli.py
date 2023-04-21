import click
from .start import start as start_function

@click.group()
def rtcshare():
    pass

@click.command()
@click.option('--dir', required=True, help='The directory to share.')
@click.option('--enable-remote-access', is_flag=True, help='Enable remote access.')
@click.option('--plugins', required=False, default='', help='Comma-separated list of plugins to load.')
def start(dir: str, enable_remote_access: bool, plugins: str):
    plugin_names = plugins.split(',')
    start_function(dir, enable_remote_access=enable_remote_access, plugin_names=plugin_names)

# Add the start command to the rtcshare group
rtcshare.add_command(start)

if __name__ == '__main__':
    rtcshare()