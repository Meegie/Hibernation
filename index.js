console.clear();
const mc = require('minecraft-protocol');

require('dotenv').config();

const Nodeactyl = require('nodeactyl');

console.log('Connecting to ' + process.env.URL)

const ptero = new Nodeactyl.NodeactylClient(process.env.URL, process.env.KEY);

var servers;
servers = {};

const states = mc.states

var c = '§';

const options = {
  motd: '§cUnable to load motd',
  'max-players': 0,
  port: 6021,
  'online-mode': false,
    version: false,

    keepAlive: false,

    beforeLogin: (client) => {
       // console.log('log', client.username, client.serverHost, client.serverPort)

       var host = String(client.serverHost);

       if (host.endsWith('s.meegie.net') == false) {
        return client.end('§cNo server found at ' +c +'e' + host);
       }

       var id = String(host).replace(`.s.meegie.net`, '');

        return client;
    },
    beforePing: (response, client) => {
        // console.log('ping', response, client.serverHost + ':' + client.serverPort);

        response.version = {
            name: 'Meegie',
            protocol: client.version
        };
        response.description.text = '§6§lServer by MeegieGame';
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
                }
            ]
        };

        var host = client.serverHost;
        host = String(host);
        if (host.endsWith('s.meegie.net') == false) {
            response.description.text = '§cNo server found at ' +c +'e' + client.serverHost;
        } else {

        var id = String(host).replace(`.s.meegie.net`, '');

        response.players.sample.push(
            {
                name: `${c}7Server id: ${c}c${id}`,
                id: '4566e69f-c907-48ee-8d71-d7ba5aa00d23'
            });

            console.log('o', id, host);

        // ptero.startServer(id).then(r => { console.log('start', r); }).catch((e) => {console.log(e)});

        if (servers[id]) {
            // if (servers[id].status == 'starting') {
                response.description.text = `${c}c${id} ${c}7is currently ${c}aOnline`;
            // }
        } else {
            response.description.text = `${c}c${id} ${c}7is currently ${c}cOffline ${c}7or ${c}aStarting\n${c}7${c}a${c}lJoin to start`;
        }
        
        }

        return response;
    },

    fallbackVersion: '1.18.2'
}

console.log('Starting...')

const server = mc.createServer(options)
const mcData = require('minecraft-data')('1.18.2');

console.log('Server is online')

server.on('login', async function (client) {


    var host = String(client.serverHost);

       if (host.endsWith('s.meegie.net') == false) {
        return client.end('§cNo server found at ' +c +'e' + host);
       }

       var id = String(host).replace(`.s.meegie.net`, '');

       if (!servers[id]) {
        await ptero.startServer(id).catch(e => { console.log('ptero', e); });
        servers[id] = {
            players: 0,
            lastPlayer: Date.now(),
            status: 'starting'
        };
       }

       var data = await ptero.getServerDetails(id).catch(e => { console.log('ptero', e); });

       var mainP;
       var mainI;
       if (!data) return client.end(`${c}cThis server does not exists.\n\n${c}7Powered by ${c}a${c}lMeegieGame`);
       var allos = data.relationships.allocations.data;
    //    console.log('d', allos);

       for (let i = 0; i < allos.length; i++) {

        var alloData = allos[i].attributes;
        if (alloData.is_default == true) {
            mainP = alloData.port;
            mainI = alloData.ip_alias;
        }

       }

    //    mainI = '192.168.1.175';
    //    mainP = 25565;

    const targetClient = mc.createClient({
        host: mainI,
        port: mainP,
        username: client.username,
        keepAlive: false,
        // noPongTimeout: 1*1000,
        skipValidation: true,
        version: client.version
      });

      servers[id].players = servers[id].players + 1;
      console.log(`Now ${servers[id].players} players ${mainI}:${mainP}`);

      client.on('disconnect', function (packet) {
        console.log('client disconnected: ' + packet.reason)
      })
      targetClient.on('disconnect', function (packet) {
        console.log('target disconnected: ' + packet.reason)
      })

      client.on('packet', (data, meta) => {
        // console.log(meta.state, targetClient.state);
        // if (targetClient.state == states.PLAY && meta.state == states.PLAY) {
            // code
            console.log('Client -> This : ' + meta.name);
            if (meta.name == 'keep_alive') {
                console.log('keep from client', data)
            //     client.write("keep_alive", {
            //         keepAliveId: meta
            //     });
            }
            targetClient.write(meta.name, data);
        // }
      });
      targetClient.on('packet', (data, meta) => {
        // console.log(meta.state, client.state);
        // if (meta.state == states.PLAY && client.state == states.PLAY) {

            // code
            // console.log('Real-Server -> This : ' + meta.name);

            if (meta.name == 'keep_alive') {
                console.log('keep from real-srv', data)
                // targetClient.write("keep_alive", {
                //     // keepAliveId: Math.floor(Math.random() * 2147483648),
                //     keepAliveId: data.keepAliveId,
                // });
            }
            
            client.write(meta.name, data);
            if (meta.name === 'set_compression') {
                client.compressionThreshold = data.threshold
              } // Set compression

        // }
      });

      var hasError;
      hasError = false;

      var isEnd;
      isEnd = false;
      client.on('end', (r) => {
        targetClient.end('Client closed connection');
        if (isEnd == false && servers[id] != undefined) servers[id].players = servers[id].players - 1;
        isEnd = true;


        if (servers[id] == undefined) return;
        console.log('Client left. ' + servers[id].players, r);

        if (hasError == false) handleEnd(client, targetClient, id);
      });
      targetClient.on('end', (r) => {
        client.end('Server closed connection: ' + String(r));
        if (isEnd == false && servers[id] != undefined) servers[id].players = servers[id].players - 1;
        isEnd = true;

        if (servers[id] == undefined) return;
        console.log('Server left. ' + servers[id].players, r);

        if (hasError == false) {
            servers[id].status = 'online';
            console.log('Server is online!')
        }

        if (hasError == false) handleEnd(client, targetClient, id);
      });

      client.on('error', (e) => {
        // hasError = true;
        targetClient.end(`The client had an error: ${String(e)}`);
        console.log('err(c->s)', String(e));
      })
      targetClient.on('error', (e) => {
        // hasError = true;
        client.end(`${c}7Server ${c}c${id} ${c}7is still starting. Re-join to try again.\n\n${c}ePowered by ${c}aMeegieGame`);
        if (String(e).includes('ECONNREFUSED')) {
            console.log('Server crashed. Removing server...');
            delete servers[id];
        }
        console.log('err(s->this)', String(e));
      })


    // console.log('join', client.username, client.serverHost, client.serverPort);
    // client.end(`${c}6${c}lServer is now ${c}astarting\n${c}7Server: ${client.serverHost}\n\n${mainI}:${mainP}`);
});

function handleEnd(client, targetClient, id) {

    console.log('> Handling player leave...');

    var dn = Date.now();
    servers[id].lastPlayer = dn;

    setTimeout(async () => {
        console.log('5 minutes', dn, servers[id].lastPlayer)
        if (servers[id] == undefined) return console.log('> Server is already off');
        if (servers[id].lastPlayer == dn && servers[id].players == 0) {
            console.log('>>> all players left. Stopping...');
            await ptero.stopServer(id).catch(e => { console.log('ptero', e); });
            delete servers[id];
        }
    }, 5 * 1000 * 60);

}