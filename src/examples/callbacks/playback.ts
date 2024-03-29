import Ari, { Channel, Playback } from 'ari-client';
import util = require('util');
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'playback-example';
const debug = Debug(appName);

// TypeScript callback version of example published on project https://github.com/asterisk/node-ari-client.

// replace ari.js with your Asterisk instance
Ari.connect(url, username, password, (err, client) => {
    if (err) return debug(err);
    debug(`Connected to ${url}`);

    // Use once to start the application
    client.once('StasisStart', (event, incoming) => {
        incoming.answer(err => {
            if (err) return debug('incoming.answer error:', err);

            const playback = client.Playback();

            // Play demo greeting and register dtmf event listeners
            incoming.play({ media: 'sound:demo-congrats' }, playback, (err, playback) => {
                registerDtmfListeners(err, playback, incoming);
            });
        });
    });

    const registerDtmfListeners = (err: Error, playback: Playback, incoming: Channel) => {
        incoming.on('ChannelDtmfReceived', (event, channel) => {
            debug('incoming.on ChannelDtmfReceived channel:', channel);

            const digit = event.digit;

            switch (digit) {
                case '5':
                    playback.control({ operation: 'pause' }, err => debug('playback.control pause error:', err));
                    break;
                case '8':
                    playback.control({ operation: 'unpause' }, err => debug('playback.control unpause error:', err));
                    break;
                case '4':
                    playback.control({ operation: 'reverse' }, err => debug('playback.control reverse error:', err));
                    break;
                case '6':
                    playback.control({ operation: 'forward' }, err => debug('playback.control forward error:', err));
                    break;
                case '2':
                    playback.control({ operation: 'restart' }, err => debug('playback.control restart error:', err));
                    break;
                case '#':
                    playback.control({ operation: 'stop' }, err => debug('playback.control stop error:', err));
                    incoming.hangup(err => {
                        debug('incoming.hangup error:', err);
                        process.exit(0);
                    });
                    break;
                default:
                    console.error(util.format('Unknown DTMF %s', digit));
            }
        });
    };

    // can also use client.start(['app-name'...]) to start multiple applications
    client.start(appName);
});
