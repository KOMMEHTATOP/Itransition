import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5193/hub/whiteboard';

let connection: signalR.HubConnection | null = null;

export function getConnection(): signalR.HubConnection {
    if (connection) return connection;

    const token = localStorage.getItem('user_token') || '';

    connection = new signalR.HubConnectionBuilder()
        .withUrl(`${HUB_URL}?token=${token}`)
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    return connection;
}

export async function startConnection(): Promise<void> {
    const conn = getConnection();
    if (conn.state === signalR.HubConnectionState.Disconnected) {
        await conn.start();
        console.log('SignalR connected');
    }
}

export async function stopConnection(): Promise<void> {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        await connection.stop();
        connection = null;
        console.log('SignalR disconnected');
    }
}

export function resetConnection(): void {
    connection = null;
}