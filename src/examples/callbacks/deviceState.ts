import Ari from 'ari-client';
import util = require('util');
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'device-state-example';
const debug = Debug(appName);

// TypeScript callback version of example published on project https://github.com/asterisk/node-ari-client.

const BRIDGE_STATE = 'device-state-example';

// replace ari.js with your Asterisk instance
Ari.connect(url, username, password, (err, client) => {
    if (err) return debug(err);
    debug(`Connected to ${url}`);

    const bridge = client.Bridge();
    // Keep track of bridge state at the application level so we don't have to
    // make extra calls to ARI
    let currentBridgeState = 'NOT_INUSE';

    bridge.create({ type: 'mixing' }, (err, instance) => {
        // Mark this bridge as available
        const opts = {
            deviceName: util.format('Stasis:%s', BRIDGE_STATE),
            deviceState: 'NOT_INUSE',
        };
        client.deviceStates.update(opts, err => {});
    });

    client.on('ChannelEnteredBridge', (event, objects) => {
        if (objects.bridge.channels.length > 0 && currentBridgeState !== 'BUSY') {
            // Mark this bridge as busy
            const opts = {
                deviceName: util.format('Stasis:%s', BRIDGE_STATE),
                deviceState: 'BUSY',
            };
            client.deviceStates.update(opts, err => {});
            currentBridgeState = 'BUSY';
        }
    });

    client.on('ChannelLeftBridge', (event, objects) => {
        if (objects.bridge.channels.length === 0 && currentBridgeState !== 'NOT_INUSE') {
            // Mark this bridge as available
            const opts = {
                deviceName: util.format('Stasis:%s', BRIDGE_STATE),
                deviceState: 'NOT_INUSE',
            };
            client.deviceStates.update(opts, err => {});
            currentBridgeState = 'NOT_INUSE';
        }
    });

    client.on('StasisStart', (event, incoming) => {
        incoming.answer(err => {
            bridge.addChannel({ channel: incoming.id }, err => {});
        });
    });

    // can also use client.start(['app-name'...]) to start multiple applications
    client.start(appName);
});
