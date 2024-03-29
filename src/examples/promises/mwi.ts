/* eslint-disable no-case-declarations */
import Ari from 'ari-client';
import util = require('util');
import { url, username, password } from '../../config';
import Debug from 'debug';
const appName = 'mwi-example';
const debug = Debug(appName);

// TypeScript promises (async/await) version of the example published on project https://github.com/asterisk/node-ari-client.

export default async () => {
    try {
        const client = await Ari.connect(url, username, password);
        debug(`Connected to ${url}`);

        // Create new mailbox
        const mailbox = client.Mailbox('mwi-example');
        let messages = 0;

        client.on('StasisStart', async (event, channel) => {
            channel.on('ChannelDtmfReceived', async (event, channel) => {
                const digit = event.digit;
                switch (digit) {
                    case '5':
                        // Record message
                        const message = client.LiveRecording();

                        message.once('RecordingFinished', async (event, newRecording) => {
                            debug('message.once RecordingFinished event:', event);
                            debug('message.once RecordingFinished newRecording:', newRecording);

                            const playback = client.Playback();
                            playback.once('PlaybackFinished', async (event, newPlayback) => {
                                debug('playback.once PlaybackFinished event:', event);
                                debug('playback.once PlaybackFinished newPlayback:', newPlayback);

                                // Update MWI
                                messages += 1;
                                const opts = {
                                    oldMessages: 0,
                                    newMessages: messages,
                                };
                                await mailbox.update(opts);
                                await channel.hangup();
                            });

                            await channel.play({ media: 'sound:vm-msgsaved' }, playback);
                        });

                        const messageOptions = {
                            name: channel.id, // name parameter is required. See channels.json fixture file.
                            format: 'wav',
                            maxSilenceSeconds: 2,
                            beep: true,
                        };

                        // Record a message
                        await channel.record(messageOptions, message);
                        break;
                    case '6':
                        // Playback last message
                        const recordings = await client.recordings.listStored();

                        const playback = client.Playback();
                        const lastMessage = recordings[recordings.length - 1];

                        if (!lastMessage) return channel.play({ media: 'sound:vm-nomore' }, playback);

                        playback.once('PlaybackFinished', async (event, newPlayback) => {
                            debug('playback.once PlaybackFinished event:', event);
                            debug('playback.once PlaybackFinished newPlayback:', newPlayback);

                            await lastMessage.deleteStored();

                            // Remove MWI
                            messages -= 1;
                            const opts = {
                                oldMessages: 0,
                                newMessages: messages,
                            };
                            await mailbox.update(opts);

                            const playback = client.Playback();
                            await channel.play({ media: 'sound:vm-next' }, playback);
                        });

                        const lastMessageOptions = {
                            media: util.format('recording:%s', lastMessage.name),
                        };

                        // Play the latest message
                        await channel.play(lastMessageOptions, playback);

                        break;
                }
            });

            await channel.answer();
            let playback = client.Playback();

            playback.once('PlaybackFinished', async (err, newPlayback) => {
                if (err) return debug('playback.once PlaybackFinished error:', err);

                debug('playback.once PlaybackFinished newPlayback:', newPlayback);

                playback = client.Playback();
                await channel.play({ media: 'sound:vm-next' }, playback);
            });

            await channel.play({ media: 'sound:vm-leavemsg' }, playback);
        });

        // can also use client.start(['app-name'...]) to start multiple applications
        client.start(appName);
    } catch (err) {
        debug(err);
    }
};
