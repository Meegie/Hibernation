const mc = require('minecraft-protocol');

console.clear();

var c = '§';

const options = {
  motd: '§cUnable to load motd',
  'max-players': 0,
  port: 6021,
  'online-mode': false,
    version: false,

    beforeLogin: (client) => {
       // console.log('log', client.username, client.serverHost, client.serverPort)
        return client;
    },
    beforePing: (response, client) => {
        // console.log('ping', response, client.serverHost + ':' + client.serverPort);
        response.version = {
            name: 'Meegie',
            protocol: client.version
        };
        response.description.text = '§6§lServer is §astarting\nAt §7' + client.serverHost + ':' + client.serverPort;
        response.players = {
            max: 0,
            online: 0,
            sample: [
                {
                    name: `${c}6Server hosted by`,
                    id: '4566e69f-c907-48ee-8d71-d7ba5aa00d20'
                },
                {
                    name: `${c}eMeegieGame`,
                    id: '4566e69f-c907-48ee-8d71-d7ba5aa00d21'
                },
                {
                    name: `${c}e`,
                    id: '4566e69f-c907-48ee-8d71-d7ba5aa00d22'
                },
                {
                    name: `${c}7Free plan`,
                    id: '4566e69f-c907-48ee-8d71-d7ba5aa00d23'
                }
            ]
        };
        return response;
    },

    fallbackVersion: '1.18.2'
}

console.log('Starting...')

const server = mc.createServer(options)
const mcData = require('minecraft-data')('1.18.2');

console.log('Server is online')

server.on('login', function (client) {
    console.log('join', client.username, client.serverHost, client.serverPort);
    client.end(`${c}6${c}lServer is now ${c}astarting\n${c}7Server: ${client.serverHost}`);
});