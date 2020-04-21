import dotenv from 'dotenv';
dotenv.config(); // SET UP ENVIROMENTAL VARIABLES BEFORE IMPORTING MODULES.

// Set these variables in .env file.
export const url = <string>process.env.ARI_URL;
export const username = <string>process.env.ARI_USERNAME;
export const password = <string>process.env.ARI_PASSWORD;

export default {
    url,
    username,
    password,
};
