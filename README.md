# rtcshare

Share a directory of files using WebRTC. For use with Figurl.

## Usage

No need to clone this repo.

Prerequisite: NodeJS >= v16

```
npx rtcshare@latest start --dir /path/to/directory/to/share --verbose

# Optionally add the --enable-remote-access button
```

The console output will contain links for attaching to your service from within a web browser.

When the service is running with --enable-remote-access, Figurl can access files in your shared directory, as in this example:

https://figurl.org/f?v=gs://figurl/figneuro-1&d=rtcshare://sleap_example/d.json&sh=https://rtcshare-proxy.herokuapp.com/s/49d84fc53ac4b444ef03&label=rtcshare%20-%20sleap
