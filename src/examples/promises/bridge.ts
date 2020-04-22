import Ari, { Channel, Bridge } from 'ari-client';
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'bridge-example';
const debug = Debug(appName);

// TypeScript promises (async/await) version of the example published on project https://github.com/asterisk/node-ari-client.

export default async () => {
    try {
        const client = await Ari.connect(url, username, password);
        debug(`Connected to ${url}`);

        client.on('StasisStart', async (event, incoming) => {
            debug(`StasisStart channel ${incoming.id}`);
            await incoming.answer();
            debug(`Channel ${incoming.id} answered`);
            const bridge = await getOrCreateBridge();
            await joinHoldingBridgeAndPlayMoh(bridge, incoming);
        });

        const getOrCreateBridge = async () => {
            const bridges = await client.bridges.list();
            let bridge = bridges.filter(candidate => {
                return candidate['bridge_type'] === 'holding';
            })[0];

            if (!bridge) {
                bridge = client.Bridge();
                return bridge.create({ type: 'holding' });
            } else {
                // Add incoming channel to existing holding bridge and play
                // music on hold
                return bridge;
            }
        };

        const joinHoldingBridgeAndPlayMoh = async (bridge: Bridge, channel: Channel) => {
            bridge.on('ChannelLeftBridge', async (event, instances) => {
                const holdingBridge = instances.bridge;
                if (holdingBridge.channels.length === 0 && holdingBridge.id === bridge.id) {
                    try {
                        await bridge.destroy();
                    } catch (err) {
                        debug(err);
                    }
                }
            });
            await bridge.addChannel({ channel: channel.id });
            await channel.startMoh();
        };

        client.start(appName);
    } catch (err) {
        debug(err);
    }
};
