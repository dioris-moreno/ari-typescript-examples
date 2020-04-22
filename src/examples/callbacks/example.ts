import Ari, { Channel } from 'ari-client';
import util = require('util');
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'example';
const debug = Debug(appName);

// TypeScript callback version of example published on project https://github.com/asterisk/node-ari-client.

// replace ari.js with your Asterisk instance
Ari.connect(url, username, password, (err, client) => {
    if (err) return debug(err);
    debug(`Connected to ${url}`);

    // Use once to start the application
    client.on('StasisStart', (event, incoming) => {
        // Handle DTMF events
        incoming.on('ChannelDtmfReceived', (event, channel) => {
            const digit = event.digit;
            switch (digit) {
                case '#':
                    play(channel, 'sound:vm-goodbye', err => {
                        channel.hangup(err => {
                            process.exit(0);
                        });
                    });
                    break;
                case '*':
                    play(channel, 'sound:tt-monkeys');
                    break;
                default:
                    play(channel, util.format('sound:digits/%s', digit));
            }
        });

        incoming.answer(err => {
            play(incoming, 'sound:hello-world');
        });
    });

    const play = (channel: Channel, sound: string, callback?: (param: any) => void) => {
        const playback = client.Playback();
        playback.once('PlaybackFinished', (event, instance) => {
            if (callback) {
                callback(null);
            }
        });
        channel.play({ media: sound }, playback, (err, playback) => {});
    };

    // can also use client.start(['app-name'...]) to start multiple applications
    client.start(appName);
});
