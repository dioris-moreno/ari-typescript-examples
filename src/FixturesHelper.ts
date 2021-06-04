import _ from 'lodash';
import path from 'path';
import appRoot from 'app-root-path';

const EVENTS_FILE = 'events.json';

export default class FixturesHelper {
    private _fixturesDir: string;

    constructor(fixturesDir: string) {
        this._fixturesDir = fixturesDir;
    }

    get fixturesDir() {
        return this._fixturesDir;
    }

    getResourceProperties(resourceName: string, className: string): string[] {
        const { models } = this.readJsonFile(this.fixturesDir, `${resourceName}.json`);
        const { properties } = models[className];
        if (!properties) return [];
        return this.getRequiredPropertyKeys(properties);
    }

    getEventProperties(className: string): string[] {
        const { models } = this.readJsonFile(this.fixturesDir, EVENTS_FILE);
        const { properties } = models[className];
        if (!properties) return [];
        return this.getRequiredPropertyKeys(properties);
    }

    /* Private Methods */
    private getRequiredPropertyKeys(properties: any) {
        const requiredProps = [];
        for (const key of _.keys(properties)) {
            let { required } = properties[key];
            if (required === undefined) required = true;
            if (required) requiredProps.push(key);
        }
        return requiredProps;
    }

    private readJsonFile = (folder: string, file: string) => {
        const filePath = path.join(appRoot.path, folder, file);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const json = require(filePath);
        return json;
    };
}
