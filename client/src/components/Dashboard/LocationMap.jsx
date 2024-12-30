import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import { Paper, Typography, Box, CircularProgress } from '@mui/material';
import { locationService } from '../../services/api';
import { startLocationTracking, stopLocationTracking } from '../../utils/locationTracker';



const LocationMap = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [path, setPath] = useState([]);
  const [error, setError] = useState(null);
  const watcherRef = useRef(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [mapCenter, setMapCenter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapContainerStyle = {
    width: '100%',
    height: '500px',
  };

  const fetchLocations = useCallback(async () => {
    try {
      const response = await locationService.getUserLocations();
      const locations = response.data;
      setLocationHistory(locations);

      if (locations.length > 0) {
        const latest = locations[0];
        setMapCenter({ lat: latest.latitude, lng: latest.longitude });
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(),
        };
        setCurrentLocation(newLocation);
        setMapCenter((prevCenter) => prevCenter || newLocation);
      },
      (error) => console.error('Error watching location:', error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    const intervalId = setInterval(fetchLocations, 10000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [fetchLocations]);

  useEffect(() => {
    watcherRef.current = startLocationTracking(
      (location) => {
        setCurrentLocation(location);
        setPath((prevPath) => [...prevPath, location]);
        setError(null);
      },
      (errMsg) => setError(errMsg)
    );

    return () => stopLocationTracking(watcherRef.current); // Cleanup on unmount
  }, []);

  if (isLoading || !mapCenter) {
    return (
      <Paper elevation={3} sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Location Tracking Map
      </Typography>
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={15}
          options={{
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: true,
            fullscreenControl: true,
          }}
        >
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 2,
                anchor: { x: 12, y: 24 },
              }}
            />
          )}
          {locationHistory.length > 1 && (
            <Polyline
              path={locationHistory.map((loc) => ({
                lat: loc.latitude,
                lng: loc.longitude,
              }))}
              options={{
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
            />
          )}
          {locationHistory.map((location, index) => (
            <Marker
              key={index}
              position={{
                lat: location.latitude,
                lng: location.longitude,
              }}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
                fillColor: '#FF0000',
                fillOpacity: 0.7,
                strokeColor: '#ffffff',
                strokeWeight: 1,
                scale: 1,
                anchor: { x: 12, y: 24 },
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
      {currentLocation && (
        <Box mt={2}>
          <Typography variant="body2">
            Current Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
          </Typography>
          <Typography variant="body2">
            Accuracy: ±{currentLocation.accuracy.toFixed(1)} meters
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default LocationMap;
