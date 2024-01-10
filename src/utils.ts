
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({
    override: true
});

export const DEV_ASSISTANT_SERVER = process.env.DEV_ASSISTANT_SERVER ?? 'https://devassistant.tonet.dev';
export const API_URL = `${DEV_ASSISTANT_SERVER}/api`;