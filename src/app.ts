import dotenv from 'dotenv';
dotenv.config(); // SET UP ENVIROMENTAL VARIABLES BEFORE IMPORTING MODULES.

import Debug from 'debug';
const debug = Debug('ari-examples');

const main = async () => {
    if (process.argv.length >= 3) {
        try {
            let version = 'promises';
            const example = process.argv[2];
            if (process.argv.length >= 4) version = process.argv[3];
            const filePath = `./examples/${version}/${example}`;
            const app = require(filePath);
            debug(`Running ${filePath}...`);
            await app.default();
        } catch (err) {
            debug(err);
        }
    }
};

main();
