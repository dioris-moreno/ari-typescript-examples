/**
 * @jest-environment node
 */
// To avoid cross origin axios error: https://github.com/axios/axios/issues/1754
import dotenv from 'dotenv';
dotenv.config(); // SET UP ENVIROMENTAL VARIABLES BEFORE IMPORTING MODULES.
import _ from 'lodash';
import ari, { Channel, Client } from 'ari-client';
import { v4 as uuidv4 } from 'uuid';
import FixturesHelper from '../src/FixturesHelper';
import { url, username, password } from '../src/config';

// Conditional skip test.
const itif = (condition: boolean) => (condition ? it : it);

const fixturesDir = 'src/fixtures';
const testModuleName = 'sounds';
const unloadableModule = 'res_stun_monitor.so';
const testVariableName = 'test';
const testVariableValue = 'test';
const testLogChannel = uuidv4();
const testAppName = uuidv4();

let client: Client;
let helper: FixturesHelper;
let applicationProps: string[];
let endpointProps: string[];
let soundProps: string[];
let channelProps: string[];
let bridgeProps: string[];
let storedRecordingProps: string[];
let rtpStatProps: string[];

describe(`ARI`, () => {
    beforeAll(async () => {
        try {
            jest.setTimeout(1000 * 30); // Set timeout to 30 seconds.
            helper = new FixturesHelper(fixturesDir);
            client = await ari.connect(url, username, password);
            client.start(testAppName, async err => {
                if (err) throw new Error(`Couldn't start application '${testAppName}' to run tests.`);
            });
            applicationProps = helper.getResourceProperties('applications', 'Application');
            endpointProps = helper.getResourceProperties('endpoints', 'Endpoint');
            soundProps = helper.getResourceProperties('sounds', 'Sound');
            channelProps = helper.getResourceProperties('channels', 'Channel');
            bridgeProps = helper.getResourceProperties('bridges', 'Bridge');
            storedRecordingProps = helper.getResourceProperties('recordings', 'StoredRecording');
            rtpStatProps = helper.getResourceProperties('channels', 'RTPstat');
        } catch (ex) {
            console.log(ex);
        }
    });

    afterAll(async () => {
        try {
            if (client) client.removeAllListeners();
        } catch (ex) {
            console.log(ex);
        }
    });

    describe('client', () => {
        it('should connect to ARI and get a valid client object', async () => {
            try {
                expect(_.isFunction(client.Application)).toBeTruthy();
                expect(_.isFunction(client.Asterisk)).toBeTruthy();
                expect(_.isFunction(client.Channel)).toBeTruthy();
                expect(_.isFunction(client.Bridge)).toBeTruthy();
                expect(_.isFunction(client.DeviceState)).toBeTruthy();
                expect(_.isFunction(client.Endpoint)).toBeTruthy();
                expect(_.isFunction(client.LiveRecording)).toBeTruthy();
                expect(_.isFunction(client.Mailbox)).toBeTruthy();
                expect(_.isFunction(client.Playback)).toBeTruthy();
                expect(_.isFunction(client.Sound)).toBeTruthy();
                expect(_.isFunction(client.StoredRecording)).toBeTruthy();
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.asterisk', () => {
        it('should execute getInfo() and receive a valid AsteriskInfo object', async () => {
            try {
                const props = helper.getResourceProperties('asterisk', 'AsteriskInfo');
                const result = await client.asterisk.getInfo();
                for (let prop of props) {
                    expect(_.keys(result).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute ping() and receive a valid AsteriskPing object', async () => {
            try {
                const props = helper.getResourceProperties('asterisk', 'AsteriskPing');
                const result = await client.asterisk.ping();
                for (let prop of props) {
                    expect(_.keys(result).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute listModules() and receive an array of valid Module objects', async () => {
            try {
                const props = helper.getResourceProperties('asterisk', 'Module');
                const list = await client.asterisk.listModules();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) throw new Error('No endpoints found to check Module object.');
                for (let prop of props) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it(`should execute getModule() and receive a valid '${testModuleName}' Module object`, async () => {
            try {
                const props = helper.getResourceProperties('asterisk', 'Module');
                const result = await client.asterisk.getModule({
                    moduleName: testModuleName,
                });
                for (let prop of props) {
                    expect(_.keys(result).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it(`should unload, load and reload a module | unloadModule() loadModule() reloadModule()`, async () => {
            try {
                await client.asterisk.unloadModule({
                    moduleName: unloadableModule,
                });
                setTimeout(async () => {
                    await client.asterisk.loadModule({
                        moduleName: unloadableModule,
                    });
                    setTimeout(async () => {
                        await client.asterisk.reloadModule({
                            moduleName: unloadableModule,
                        });
                    }, 1000);
                }, 1000);
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute listLogChannels() and receive an array of valid LogChannel objects', async () => {
            try {
                const props = helper.getResourceProperties('asterisk', 'LogChannel');
                const list = await client.asterisk.listLogChannels();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) throw new Error('No endpoints found to check LogChannel object.');
                for (let prop of props) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should set and get a global variable | setGlobalVar() getGlobalVar()', async () => {
            try {
                await client.asterisk.setGlobalVar({
                    variable: testVariableName,
                    value: testVariableValue,
                });
                setTimeout(async () => {
                    const result = await client.asterisk.getGlobalVar({
                        variable: testVariableName,
                    });
                    expect(result.value).toBe(testVariableValue);
                }, 1000);
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should add, get and remove a log channel | addLog() listLogChannels() removeLog()', async () => {
            try {
                // Log Channel Example
                //   { channel: '/var/log/asterisk/messages',
                //   type: 'File',
                //   status: 'Enabled',
                //   configuration: 'NOTICE WARNING ERROR ' }
                // await client.asterisk.deleteLog({
                //   logChannelName:
                //     "/var/log/asterisk/3dcb15c2-44f5-4c6f-842f-fbf664df6338",
                // });
                await client.asterisk.addLog({
                    logChannelName: testLogChannel,
                    configuration: 'NOTICE WARNING ERROR ',
                });
                const channelProp = `/var/log/asterisk/${testLogChannel}`;
                let list = await client.asterisk.listLogChannels();
                const added = list.find(logChannel => logChannel.channel === channelProp);
                expect(added).toBeTruthy();
                if (!added) throw new Error('Log channel was not added.');
                //TODO: test client.asterisk.rotateLog().
                // await client.asterisk.rotateLog({ logChannelName: testLogChannel });
                await client.asterisk.deleteLog({ logChannelName: channelProp });
                list = await client.asterisk.listLogChannels();
                const deleted = list.find(logChannel => logChannel.channel === channelProp);
                expect(deleted === undefined).toBeTruthy();
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.endpoints', () => {
        it('should execute list() and receive an array of valid Endpoint objects', async () => {
            try {
                const list = await client.endpoints.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No endpoints found to check Endpoint object.');
                for (let prop of endpointProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it(`should execute get() and receive a valid Endpoint object`, async () => {
            try {
                const list = await client.endpoints.list();
                if (list.length === 0) return console.warn('No endpoints found to run get() test.');
                const endpoint1 = list[0];
                const endpoint2 = await client.endpoints.get({
                    tech: endpoint1.technology,
                    resource: endpoint1.resource,
                });
                for (let prop of endpointProps) {
                    const item1 = <any>endpoint1,
                        item2 = <any>endpoint2;
                    expect(item1[prop]).toStrictEqual(item2[prop]);
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute listByTech() and receive an array of valid Endpoint objects', async () => {
            try {
                let list = await client.endpoints.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No endpoints found to run get() test.');
                const tech: string = list[0].technology;
                list = await client.endpoints.listByTech({ tech });
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No endpoints found to run get() test.');
                for (let prop of endpointProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.sounds', () => {
        it('should execute list() and receive an array of valid Sound objects', async () => {
            try {
                const list = await client.sounds.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No sounds found to check Sound object.');
                for (let prop of soundProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it(`should execute get() and receive a valid Endpoint object`, async () => {
            try {
                const list = await client.sounds.list();
                if (list.length === 0) return console.warn('No sounds found to run get() test.');
                const sound1 = list[0];
                const sound2 = await client.sounds.get({ soundId: sound1.id });
                for (let prop of soundProps) {
                    const item1 = <any>sound1,
                        item2 = <any>sound2;
                    expect(item1[prop]).toStrictEqual(item2[prop]);
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.applications', () => {
        it('should execute list() and receive an array of valid Application objects', async () => {
            try {
                const list = await client.applications.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No applications found to check Application object.');
                for (let prop of applicationProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute filter() and receive an array of valid Application objects', async () => {
            try {
                const app = await client.applications.filter({
                    applicationName: testAppName,
                });
                if (_.isEmpty(app)) return console.warn('No applications found to check Application object.');
                for (let prop of applicationProps) {
                    expect(_.keys(app).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should subscribe() and unsubscribe() an eventSource to an Application', async () => {
            try {
                // Get and Endpoint to run this test.
                const list = await client.endpoints.list();
                if (list.length === 0) return console.warn('No endpoints found to run subscribe() test.');
                const endpoint = list[0];
                const eventSource = `endpoint:${endpoint.technology}/${endpoint.resource}`;
                const subscribed = await client.applications.subscribe({
                    applicationName: testAppName,
                    eventSource,
                });
                expect(_.isEmpty(subscribed)).toBeFalsy();
                for (let prop of applicationProps) {
                    expect(_.keys(subscribed).includes(prop)).toBeTruthy();
                }
                const unsubscribed = await client.applications.unsubscribe({
                    applicationName: testAppName,
                    eventSource,
                });
                expect(_.isEmpty(unsubscribed)).toBeFalsy();
                for (let prop of applicationProps) {
                    expect(_.keys(unsubscribed).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it(`should execute get() and receive a valid Application object`, async () => {
            try {
                const list = await client.applications.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No applications found to check Application object.');
                const app1 = list[0];
                const app2 = await client.applications.get({
                    applicationName: app1.name,
                });
                for (let prop of applicationProps) {
                    const item1 = <any>app1,
                        item2 = <any>app2;
                    expect(item1[prop]).toStrictEqual(item2[prop]);
                }
                for (let prop of applicationProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.channels', () => {
        it('should execute list() and receive an array of valid Channel objects', async () => {
            try {
                const list = await client.channels.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No channels found to check Channel object.');
                for (let prop of channelProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.bridges', () => {
        it('should execute list() and receive an array of valid Bridge objects', async () => {
            try {
                const list = await client.bridges.list();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No bridges found to check Bridge object.');
                for (let prop of bridgeProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });

    describe('client.recordings', () => {
        it('should execute listStored() and receive an array of valid StoredRecording objects', async () => {
            try {
                const list = await client.recordings.listStored();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No recordings found to check StoredRecording object.');
                for (let prop of storedRecordingProps) {
                    expect(_.keys(list[0]).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute getStored() and receive a valid StoredRecording object', async () => {
            try {
                const list = await client.recordings.listStored();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No recordings found to run getStored() test.');
                const recording = await client.recordings.getStored({
                    recordingName: list[0].name,
                });
                for (let prop of storedRecordingProps) {
                    expect(_.keys(recording).includes(prop)).toBeTruthy();
                }
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should execute getStoredFile() and receive a Buffer object', async () => {
            try {
                const list = await client.recordings.listStored();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No recordings found to run getStoredFile() test.');
                const buffer = await client.recordings.getStoredFile({
                    recordingName: list[0].name,
                });
                expect(Buffer.isBuffer(buffer)).toBeTruthy();
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
        it('should copy and delete (copyStored, deleteStored) a valid StoredRecording object', async () => {
            try {
                let list = await client.recordings.listStored();
                expect(_.isArray(list)).toBeTruthy();
                if (list.length === 0) return console.warn('No recordings found to run copyStored() test.');
                const recordingName = list[0].name;
                const destinationRecordingName = `test-${uuidv4()}`;
                // console.log(recordingName);
                const recording = await client.recordings.copyStored({
                    recordingName,
                    destinationRecordingName,
                });
                expect(recording.name).toBe(destinationRecordingName);
                for (let prop of storedRecordingProps) {
                    expect(_.keys(recording).includes(prop)).toBeTruthy();
                }
                // Delete copied recording.
                await client.recordings.deleteStored({ recordingName: destinationRecordingName });
                // Look for the deleted recording.
                list = await client.recordings.listStored();
                const found = list.find(recording => recording.name === destinationRecordingName);
                expect(found === undefined).toBeTruthy();
            } catch (ex) {
                expect(ex).toBeFalsy();
            }
        });
    });
});
