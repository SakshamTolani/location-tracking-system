// Minor improvements and comments for better readability
import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography, Switch, Alert, Button } from '@mui/material';
import LocationTracker from '../../utils/locationTracker';
import { useAuth } from '../../context/AuthContext';
import LocationMap from './LocationMap';

const Dashboard = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState('');
  const [tracker, setTracker] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const { user } = useAuth();

  const checkPermissionStatus = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(result.state);

      result.addEventListener('change', () => setPermissionStatus(result.state));
    } catch (err) {
      console.error('Error checking permission:', err);
      setError('Unable to check location permission status');
    }
  }, []);

  useEffect(() => {
    const initializeTracker = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found');
          return;
        }

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const newTracker = new LocationTracker(
          `${wsProtocol}//${window.location.hostname}:3000`,
          token,
          {
            maxReconnectAttempts: 5,
            updateInterval: 4000,
            connectionTimeout: 5000,
            maxQueueSize: 50,
          }
        );

        setTracker(newTracker);
        await checkPermissionStatus();
      } catch (err) {
        console.error('Error initializing tracker:', err);
        setError('Failed to initialize location tracker');
      }
    };

    initializeTracker();

    return () => tracker?.stop();
  }, [checkPermissionStatus]);

  const requestPermission = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      async () => {
        await handleTrackingToggle();
      },
      (error) => {
        console.error('Permission error:', error);
        setError('Please enable location access in your browser settings.');
        setPermissionStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, []);

  const handleTrackingToggle = async () => {
    if (!tracker) {
      setError('Location tracker not initialized');
      return;
    }

    try {
      if (!isTracking) {
        await tracker.start();
        setIsTracking(true);
        setError('');
      } else {
        tracker.stop();
        setIsTracking(false);
      }
    } catch (err) {
      console.error('Tracking error:', err);
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Location Tracking Dashboard
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {permissionStatus === 'denied' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Location access is blocked. Please enable location access in your browser settings.
          </Alert>
        )}
        <Box display="flex" alignItems="center" mb={2}>
          <Typography>Location Tracking:</Typography>
          {permissionStatus === 'prompt' ? (
            <Button variant="contained" color="primary" onClick={requestPermission}>
              Request Permission
            </Button>
          ) : (
            <Switch checked={isTracking} onChange={handleTrackingToggle} disabled={permissionStatus !== 'granted'} />
          )}
        </Box>
      </Paper>
      {isTracking && <LocationMap />}
    </Box>
  );
};

export default Dashboard;
