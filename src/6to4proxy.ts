let argv = process.argv;
if ( argv.length < 4) {
    printUsage(argv[1]);
    process.exit(1);
}
let ip6ToListen     : string = process.argv[2];
let portsToForward  : number[];

try {
    portsToForward = argv.slice(3).map( portStr => parseInt(portStr) );
}
catch (err) {
    console.error("problem parsing the given port(s)");
    console.error(err);
}

console.info("IP listening: %s", ip6ToListen);
console.info("ports:        %s", portsToForward.join(","));

import net = require('net');

setupListening(ip6ToListen, portsToForward);

function setupListening(ip2Listen : string, ports : number[]) {
    ports.forEach( (val) => {
        forwardOnePort(ip2Listen, val);
    })
}

function forwardOnePort(ip2Listen : string, portToForward : number) {
    let server6 : net.Server = net.createServer( (sock6 : net.Socket) => {
        console.info('v6 socket opened from: %s', sock6.remoteAddress);

        let sock4 : net.Socket = net.connect( { port: portToForward }, () => {
            sock4.pipe(sock6);
            sock6.pipe(sock4);
        } );

        sock4.on('end', () => {
            console.debug('v4 socket got closed. closing v6 socket too.');
            sock6.end();
        });

        sock6.on('end', () => {
            console.debug('v6 socket got closed. closing v4 socket too.');
            sock4.end();
        });
    });

    server6.listen( portToForward, ip6ToListen, () => {
        console.info('listening on %s port %d', ip6ToListen, portToForward);
    });
}

function printUsage(scriptname : string) {
    console.info("usage: %s {IPv6 address} {port}...", scriptname);
}