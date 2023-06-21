from setuptools import setup, find_packages
# from setuptools import Command
# from setuptools.command.install import install
# from setuptools.command.develop import develop
# import os
# import subprocess

# read the contents of README.md
from pathlib import Path
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text()

__version__ = '0.1.4'

# # This will be used for both install and develop
# def npm_install_command(command_subclass):
#     """A decorator for classes subclassing one of the setuptools commands.

#     It modifies the run() method so that it prints a friendly greeting.
#     """
#     orig_run = command_subclass.run

#     def modified_run(self):
#         # Build the Node.js package
#         print("Building Node.js package...")
#         # apparently shell=True is necessary for Windows, but shell=False is necessary for Linux
#         # if we are on windows, we need to use shell=True
#         if os.name == 'nt':
#             shell = True
#         elif os.name == 'posix':
#             shell = False
#         else:
#             print(f'Warning: unrecognized os.name: {os.name}')
#             shell = False
#         subprocess.check_call(['npm', 'install'], cwd=f'{this_directory}/rtcshare/js', shell=shell)
#         subprocess.check_call(['npm', 'run', 'build'], cwd=f'{this_directory}/rtcshare/js', shell=shell)
#         orig_run(self)

#     command_subclass.run = modified_run
#     return command_subclass

# @npm_install_command
# class NpmInstallCommand(install):
#     pass

# @npm_install_command
# class NpmDevelopCommand(develop):
#     pass

setup(
    name='rtcshare',
    version=__version__,
    author="Jeremy Magland",
    author_email="jmagland@flatironinstitute.org",
    url="https://github.com/scratchrealm/rtcshare",
    description="Share a directory and resources with the browser and with remote computers. For use with Figurl.",
    long_description=long_description,
    long_description_content_type='text/markdown',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'click',
        'zarr'
    ],
    cmdclass={
        # 'install': NpmInstallCommand,
        # 'develop': NpmDevelopCommand
    },
    entry_points={
        "console_scripts": [
            "rtcshare=rtcshare.cli:rtcshare",
        ],
    }
)