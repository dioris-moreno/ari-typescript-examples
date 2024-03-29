import Ari, { Channel } from 'ari-client';
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'originate-example';
const debug = Debug(appName);

// TypeScript promises (async/await) version of the example published on project https://github.com/asterisk/node-ari-client.

export default async () => {
    try {
        const ENDPOINT = 'PJSIP/sipphone';
        const client = await Ari.connect(url, username, password);
        debug(`Connected to ${url}`);

        // Use once to start the application to ensure this listener will only run
        // for the incoming channel
        client.once('StasisStart', async (event, incoming) => {
            await incoming.answer();
            originate(incoming);
        });

        const originate = async (incoming: Channel) => {
            incoming.once('StasisEnd', async (event, channel) => {
                debug('incoming.once StasisEnd event:', event);
                debug('incoming.once StasisEnd channel:', channel);

                await outgoing.hangup();
            });

            const outgoing = client.Channel();

            outgoing.once('ChannelDestroyed', async (event, channel) => {
                debug('outgoing.once ChannelDestroyed event:', event);
                debug('outgoing.once ChannelDestroyed channel:', channel);

                await incoming.hangup();
            });

            outgoing.once('StasisStart', async (event, outgoing) => {
                debug('outgoing.once StasisStart event:', event);
                debug('outgoing.once StasisStart outgoing:', outgoing);

                const bridge = client.Bridge();

                outgoing.once('StasisEnd', async (event, channel) => {
                    debug('outgoing.once StasisEnd event:', event);
                    debug('outgoing.once StasisEnd channel:', channel);

                    await bridge.destroy();
                });

                await outgoing.answer();
                const mixingBridge = await bridge.create({ type: 'mixing' });
                await mixingBridge.addChannel({ channel: [incoming.id, outgoing.id] });
            });

            const playback = client.Playback();
            await incoming.play({ media: 'sound:vm-dialout' }, playback);

            // Originate call from incoming channel to endpoint
            await outgoing.originate({
                endpoint: ENDPOINT,
                app: appName,
                appArgs: 'dialed',
            });
        };

        client.start(appName);
    } catch (err) {
        debug(err);
    }
};
