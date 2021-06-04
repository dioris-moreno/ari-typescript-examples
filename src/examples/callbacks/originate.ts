import Ari, { Channel, Containers } from 'ari-client';
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'originate-example';
const debug = Debug(appName);

// TypeScript callback version of example published on project https://github.com/asterisk/node-ari-client.

const ENDPOINT = 'PJSIP/sipphone';

// replace ari.js with your Asterisk instance
Ari.connect(url, username, password, (err, client) => {
    if (err) return debug(err);
    debug(`Connected to ${url}`);

    // Use once to start the application to ensure this listener will only run
    // for the incoming channel
    client.once('StasisStart', (event, incoming) => {
        debug('iclient.once StasisStart event:', event);

        incoming.answer(err => {
            if (err) return debug('incoming.answer error:', err);

            originate(incoming);
        });
    });

    const originate = (incoming: Channel) => {
        incoming.once('StasisEnd', (event, channel) => {
            debug('incoming.once StasisEnd event:', event);
            debug('incoming.once StasisEnd channel:', channel);

            outgoing.hangup(err => {
                if (err) debug('StasisEnd outgoing.hangup error:', err);
            });
        });

        const outgoing = client.Channel();

        outgoing.once('ChannelDestroyed', (event, channel) => {
            debug('outgoing.once ChannelDestroyed event:', event);
            debug('outgoing.once ChannelDestroyed channel:', channel);

            incoming.hangup(err => {
                if (err) debug('ChannelDestroyed incoming.hangup error:', err);
            });
        });

        outgoing.once('StasisStart', (event, outgoing) => {
            debug('outgoing.once StasisStart event:', event);

            const bridge = client.Bridge();

            outgoing.once('StasisEnd', (event, channel) => {
                debug('outgoing.once StasisEnd event:', event);
                debug('outgoing.once StasisEnd channel:', channel);

                bridge.destroy(err => {
                    if (err) debug('StasisEnd bridge.destroy error:', err);
                });
            });

            outgoing.answer(err => {
                if (err) return debug('outgoing.answer error:', err);

                bridge.create({ type: 'mixing' }, (err, bridge) => {
                    bridge.addChannel({ channel: [incoming.id, outgoing.id] }, err => {
                        if (err) return debug('bridge.addChannel error:', err);
                    });
                });
            });
        });

        const playback = client.Playback();
        incoming.play({ media: 'sound:vm-dialout' }, playback, err => {
            if (err) return debug('incoming.play error:', err);
        });

        // Originate call from incoming channel to endpoint
        const variables: Containers = { 'CALLERID(name)': 'Alice', name: 'test' };
        outgoing.originate({ endpoint: ENDPOINT, app: appName, appArgs: 'dialed', variables }, (err, channel) => {
            if (err) return debug('outgoing.originate error:', err);

            debug('incoming.play channel:', channel);
        });
    };

    // can also use client.start(['app-name'...]) to start multiple applications
    client.start(appName);
});
