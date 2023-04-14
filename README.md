# rtcshare

Share a directory of files using WebRTC. For use with Figurl.

## Usage

No need to clone this repo.

Prerequisite: NodeJS >= v16

```
npx rtcshare@latest start --dir /path/to/directory/to/share --verbose

# Optionally add the --enable-remote-access option
```

The console output will contain links for attaching to your service from within a web browser.

When the service is running with --enable-remote-access, Figurl can access files in your shared directory, as in this example:

https://figurl.org/f?v=gs://figurl/figneuro-1&d=rtcshare://sleap_example/d.json&sh=https://rtcshare-proxy.herokuapp.com/s/49d84fc53ac4b444ef03&label=rtcshare%20-%20sleap

## Using a TURN server

A direct connection between peers is not always possible. In this case, a [TURN server](https://webrtc.org/getting-started/turn-server) can be used to relay the data.

You can use a free TURN server for limited use from [metered.ca](https://metered.ca/). Sign up for an account, create a free app, and save the credentials. Then set the following environment variables prior to running rtcshare:

```bash
# The app name
export RTCSHARE_METERED_APP_NAME=...

# The API key
export RTCSHARE_METERED_APP_KEY=...
```

In the future we will want to add support for using your own TURN server.