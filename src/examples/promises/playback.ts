import Ari, { Channel, Playback } from 'ari-client';
import { url, username, password } from '../../config';
import util = require('util');
import Debug from 'debug';
const appName = 'playback-example';
const debug = Debug(appName);

// TypeScript promises (async/await) version of the example published on project https://github.com/asterisk/node-ari-client.

export default async () => {
    try {
        const client = await Ari.connect(url, username, password);
        debug(`Connected to ${url}`);

        // Use once to start the application
        client.once('StasisStart', async (event, incoming) => {
            await incoming.answer();
            const playback = client.Playback();
            // Play demo greeting and register dtmf event listeners
            const newPlayback = await incoming.play({ media: 'sound:demo-congrats' }, playback);
            registerDtmfListeners(newPlayback, incoming);
        });

        const registerDtmfListeners = (playback: Playback, incoming: Channel) => {
            incoming.on('ChannelDtmfReceived', async (event, channel) => {
                debug('incoming.on ChannelDtmfReceived channel:', channel);

                const digit = event.digit;
                switch (digit) {
                    case '5':
                        await playback.control({ operation: 'pause' });
                        break;
                    case '8':
                        await playback.control({ operation: 'unpause' });
                        break;
                    case '4':
                        await playback.control({ operation: 'reverse' });
                        break;
                    case '6':
                        await playback.control({ operation: 'forward' });
                        break;
                    case '2':
                        await playback.control({ operation: 'restart' });
                        break;
                    case '#':
                        await playback.control({ operation: 'stop' });
                        await incoming.hangup();
                        process.exit(0);
                        break;
                    default:
                        debug(util.format('Unknown DTMF %s', digit));
                }
            });
        };

        client.start(appName);
    } catch (err) {
        debug(err);
    }
};
