import Ari, { Channel, Bridge, ChannelLeftBridge } from 'ari-client';
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'bridge-example';
const debug = Debug(appName);

// TypeScript callback version of example published on project https://github.com/asterisk/node-ari-client.

Ari.connect(url, username, password, (err, client) => {
    if (err) return debug(err);
    debug(`Connected to ${url}`);

    // use once to start the application
    client.on('StasisStart', (event, incoming) => {
        incoming.answer(err => {
            if (err) return debug('incoming.answer error:', err);

            getOrCreateBridge(incoming);
        });
    });

    const getOrCreateBridge = (channel: Channel) => {
        client.bridges.list((err: Error, bridges: Bridge[]) => {
            let bridge = bridges.filter((candidate: Bridge) => {
                return candidate['bridge_type'] === 'holding';
            })[0];

            if (!bridge) {
                bridge = client.Bridge();
                bridge.create({ type: 'holding' }, (err: Error, bridge: Bridge) => {
                    bridge.on('ChannelLeftBridge', (event, instances) => {
                        cleanupBridge(event, instances, bridge);
                    });
                    joinHoldingBridgeAndPlayMoh(bridge, channel);
                });
            } else {
                // Add incoming channel to existing holding bridge and play
                // music on hold
                joinHoldingBridgeAndPlayMoh(bridge, channel);
            }
        });
    };

    const cleanupBridge = (event: ChannelLeftBridge, instances: ChannelLeftBridge, bridge: Bridge) => {
        const holdingBridge = instances.bridge;
        if (holdingBridge.channels.length === 0 && holdingBridge.id === bridge.id) {
            bridge.destroy(err => debug('startMoh error:', err));
        }
    };

    const joinHoldingBridgeAndPlayMoh = (bridge: Bridge, channel: Channel) => {
        bridge.addChannel({ channel: channel.id }, err => {
            debug('addChannel error:', err);
            channel.startMoh(err => debug('startMoh error:', err));
        });
    };

    // can also use client.start(['app-name'...]) to start multiple applications
    client.start('bridge-example');
});
