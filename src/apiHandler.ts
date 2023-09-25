import axios from 'axios';
import { API_URL } from './utils';

export class ApiHandler {
    public static async getTokenRequest(deviceId: string): Promise<any> {
        const response = await axios.post(`${API_URL}/ably/token-request?device_id=${deviceId}`);
        return response.data;
    }

    // Outras chamadas API podem ser adicionadas aqui conforme necessário
}