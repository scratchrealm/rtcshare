import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import getIceServers from './getIceServers'
import Server from './Server'
import net from 'net'

const main = () => {
    yargs(hideBin(process.argv))
        .command('start', 'Start sharing', (yargs) => {
            return yargs
        }, (argv) => {
            const dir: string = argv.dir as string
            getIceServers().then((iceServers) => {
                start({ port: parseInt(process.env.PORT || "61752"), dir, verbose: argv.verbose ? true : false, enableRemoteAccess: argv['enable-remote-access'] ? true : false, iceServers })
            })
        })
        .option('verbose', {
            alias: 'v',
            type: 'boolean',
            description: 'Run with verbose logging'
        })
        .option('dir', {
            type: 'string',
            description: 'Directory to share'
        })
        .option('enable-remote-access', {
            type: 'boolean',
            description: 'Enable remote access'
        })
        .strictCommands()
        .demandCommand(1)
        .parse()
}

let server: Server
function start({ port, dir, verbose, enableRemoteAccess, iceServers }: { port: number, dir: string, verbose: boolean, enableRemoteAccess: boolean, iceServers: any | undefined }) {
    server = new Server({ port, dir, verbose, enableRemoteAccess, iceServers })
    server.start()
}

process.on('SIGINT', function () {
    if (server) {
        console.info('Stopping server.')
        server.stop().then(() => {
            console.info('Exiting.')
            process.exit()
        })
    }
    setTimeout(() => {
        // exit no matter what after a few seconds
        process.exit()
    }, 3000)
})

main()