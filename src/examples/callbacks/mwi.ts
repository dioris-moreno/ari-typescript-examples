/* eslint-disable no-case-declarations */
import Ari from 'ari-client';
import util = require('util');
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'mwi-example';
const debug = Debug(appName);

// TypeScript callback version of example published on project https://github.com/asterisk/node-ari-client.

// replace ari.js with your Asterisk instance
Ari.connect(url, username, password, (err, client) => {
    if (err) return debug(err);
    debug(`Connected to ${url}`);

    // Create new mailbox
    const mailbox = client.Mailbox(appName);
    let messages = 0;

    client.on(
        'StasisStart',

        (event, channel) => {
            channel.on('ChannelDtmfReceived', (event, channel) => {
                const digit = event.digit;
                switch (digit) {
                    case '5':
                        // Record message
                        const recording = client.LiveRecording();

                        recording.once('RecordingFinished', (event, newRecording) => {
                            debug('recording.once RecordingFinished event:', event);
                            debug('recording.once RecordingFinished newRecording:', newRecording);

                            const playback = client.Playback();
                            playback.once('PlaybackFinished', (event, newPlayback) => {
                                debug('playback.once PlaybackFinished event:', event);
                                debug('playback.once PlaybackFinished newPlayback:', newPlayback);

                                // Update MWI
                                messages += 1;
                                const opts = {
                                    oldMessages: 0,
                                    newMessages: messages,
                                };
                                mailbox.update(opts, err => {
                                    if (err) return debug('mailbox.update error:', err);
                                });

                                channel.hangup(err => {
                                    if (err) return debug('channel.hangup error:', err);
                                });
                            });

                            channel.play({ media: 'sound:vm-msgsaved' }, playback, err => {
                                if (err) return debug('channel.play error:', err);
                            });
                        });

                        const opts = {
                            name: channel.id, // name parameter is required. See channels.json fixture file.
                            format: 'wav',
                            maxSilenceSeconds: 2,
                            beep: true,
                        };

                        // Record a message
                        channel.record(opts, recording, err => {
                            if (err) return debug('channel.record error:', err);
                        });
                        break;
                    case '6':
                        // Playback last message
                        client.recordings.listStored((err, recordings) => {
                            const playback = client.Playback();
                            const recording = recordings[recordings.length - 1];

                            if (!recording) {
                                channel.play({ media: 'sound:vm-nomore' }, playback, err => {
                                    if (err) return debug('channel.play error:', err);
                                });
                            } else {
                                playback.once('PlaybackFinished', (event, newPlayback) => {
                                    debug('playback.once PlaybackFinished event:', event);
                                    debug('playback.once PlaybackFinished newPlayback:', newPlayback);

                                    recording.deleteStored(err => {
                                        if (err) return debug('recording.deleteStored error:', err);

                                        // Remove MWI
                                        messages -= 1;
                                        const opts = {
                                            oldMessages: 0,
                                            newMessages: messages,
                                        };
                                        mailbox.update(opts, err => {
                                            if (err) return debug('mailbox.update error:', err);
                                        });

                                        const playback = client.Playback();
                                        channel.play({ media: 'sound:vm-next' }, playback, err => {
                                            if (err) return debug('channel.play error:', err);
                                        });
                                    });
                                });

                                const opts = {
                                    media: util.format('recording:%s', recording.name),
                                };

                                // Play the latest message
                                channel.play(opts, playback, err => {
                                    if (err) return debug('channel.play error:', err);
                                });
                            }
                        });
                        break;
                }
            });

            channel.answer(err => {
                if (err) return debug('channel.answer error:', err);

                let playback = client.Playback();

                playback.once('PlaybackFinished', (err, newPlayback) => {
                    if (err) return debug('playback.once PlaybackFinished error:', err);

                    debug('playback.once PlaybackFinished newPlayback:', newPlayback);

                    playback = client.Playback();

                    channel.play({ media: 'sound:vm-next' }, playback, err => {
                        if (err) debug('channel.play error:', err);
                    });
                });

                channel.play({ media: 'sound:vm-leavemsg' }, playback, err => {
                    if (err) debug('channel.play error:', err);
                });
            });
        },
    );

    // can also use client.start(['app-name'...]) to start multiple applications
    client.start(appName);
});
