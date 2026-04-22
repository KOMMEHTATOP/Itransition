import * as signalR from '@microsoft/signalr';

const HUB_URL = 'http://localhost:5193/hub/whiteboard';

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<void> | null = null;

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

    // Already connected
    if (conn.state === signalR.HubConnectionState.Connected) {
        return;
    }

    // Connection in progress — wait for it
    if (conn.state === signalR.HubConnectionState.Connecting ||
        conn.state === signalR.HubConnectionState.Reconnecting) {
        if (startPromise) {
            return startPromise;
        }
    }

    // Start new connection
    if (conn.state === signalR.HubConnectionState.Disconnected) {
        startPromise = conn.start().then(() => {
            console.log('SignalR connected');
            startPromise = null;
        }).catch((err) => {
            startPromise = null;
            throw err;
        });
        return startPromise;
    }
}

export async function stopConnection(): Promise<void> {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        await connection.stop();
        connection = null;
        startPromise = null;
        console.log('SignalR disconnected');
    }
}

export function resetConnection(): void {
    connection = null;
    startPromise = null;
}