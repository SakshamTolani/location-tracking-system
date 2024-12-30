export default class LocationTracker {
    constructor(serverUrl, authToken, options = {}) {
        this.serverUrl = serverUrl;
        this.authToken = authToken;
        this.ws = null;
        this.intervalId = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;

        // Configuration with defaults
        this.config = {
            maxReconnectAttempts: options.maxReconnectAttempts || 5,
            updateInterval: options.updateInterval || 4000,
            connectionTimeout: options.connectionTimeout || 5000,
            geolocationOptions: {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
                ...options.geolocationOptions
            }
        };

        this.lastUpdate = 0;
        this.locationUpdateQueue = [];
        this.maxQueueSize = options.maxQueueSize || 50;
    }

    async start() {
        if (!navigator.geolocation) {
            throw new Error('Geolocation is not supported by your browser');
        }

        const permission = await this.requestLocationPermission();
        if (permission !== 'granted') {
            throw new Error('Location permission denied');
        }

        await this.connectWebSocket();
        this.watchLocation();
    }

    async requestLocationPermission() {
        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state;
        } catch (error) {
            console.error('Error requesting location permission:', error);
            throw error;
        }
    }

    connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                this.ws = new WebSocket(`${this.serverUrl}?token=${this.authToken}`);

                this.ws.onopen = this.handleWebSocketOpen.bind(this, resolve);
                this.ws.onclose = this.handleWebSocketClose.bind(this);
                this.ws.onerror = this.handleWebSocketError.bind(this, reject);

                // Connection timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, this.config.connectionTimeout);
            } catch (error) {
                reject(error);
            }
        });
    }

    handleWebSocketOpen(resolve) {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.sendQueuedUpdates();
        resolve();
    }

    handleWebSocketClose() {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.handleDisconnect();
    }

    handleWebSocketError(reject, error) {
        console.error('WebSocket error:', error);
        if (!this.isConnected) {
            reject(error);
        }
    }

    watchLocation() {
        const periodicUpdate = async () => {
            try {
                const position = await this.getCurrentPosition();
                const now = Date.now();

                if (now - this.lastUpdate >= this.config.updateInterval) {
                    await this.handleLocationUpdate(position);
                    this.lastUpdate = now;
                }
            } catch (error) {
                this.handleLocationError(error);
            }
        };

        periodicUpdate();
        this.intervalId = setInterval(periodicUpdate, this.config.updateInterval);
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                this.config.geolocationOptions
            );
        });
    }

    async handleLocationUpdate(position) {
        const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
        };

        if (!this.isConnected) {
            this.queueLocationUpdate(locationData);
            return;
        }

        try {
            await this.sendLocationUpdate(locationData);
        } catch (error) {
            console.error('Error sending location update:', error);
            this.queueLocationUpdate(locationData);
        }
    }

    queueLocationUpdate(locationData) {
        if (this.locationUpdateQueue.length >= this.maxQueueSize) {
            this.locationUpdateQueue.shift(); // Remove oldest update
        }
        this.locationUpdateQueue.push(locationData);
    }

    async sendQueuedUpdates() {
        while (this.isConnected && this.locationUpdateQueue.length > 0) {
            const locationData = this.locationUpdateQueue.shift();
            try {
                await this.sendLocationUpdate(locationData);
            } catch (error) {
                console.error('Error sending queued update:', error);
                this.queueLocationUpdate(locationData);
                break;
            }
        }
    }

    sendLocationUpdate(locationData) {
        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket not connected'));
                return;
            }

            try {
                this.ws.send(JSON.stringify(locationData));
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    handleLocationError(error) {
        console.error('Error getting location:', error);
        if (error.code === error.PERMISSION_DENIED) {
            this.stop();
        }
    }

    async handleDisconnect() {
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.stop();
            return;
        }

        const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        this.reconnectAttempts++;

        console.log(`Attempting to reconnect in ${backoffTime / 1000} seconds...`);

        await new Promise(resolve => setTimeout(resolve, backoffTime));

        try {
            await this.connectWebSocket();
        } catch (error) {
            console.error('Reconnection failed:', error);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.isConnected = false;
        this.locationUpdateQueue = [];
    }
}

export const startLocationTracking = (onSuccess, onError) => {
    if (!navigator.geolocation) {
        onError('Geolocation is not supported by your browser.');
        return null;
    }

    const watcher = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            onSuccess({ lat: latitude, lng: longitude, accuracy });
        },
        (err) => {
            console.error('GeolocationPositionError:', err);
            onError(`Error: ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 } // 30 seconds timeout
    );

    return watcher;
};

export const stopLocationTracking = (watcher) => {
    if (watcher !== null) {
        navigator.geolocation.clearWatch(watcher);
    }
};