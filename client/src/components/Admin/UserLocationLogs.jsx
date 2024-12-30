import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import { locationService } from '../../services/api';

const UserLocationLogs = () => {
    const { userId } = useParams();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await locationService.getUserLocationLogs(userId);
                setLogs(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch location logs');
                setLoading(false);
            }
        };

        fetchLogs();
    }, [userId]);

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Location Logs for User ID: {userId}
                </Typography>

                {loading ? (
                    <CircularProgress />
                ) : error ? (
                    <Alert severity="error">{error}</Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Latitude</TableCell>
                                    <TableCell>Longitude</TableCell>
                                    <TableCell>Accuracy</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.timestamp}>
                                        <TableCell>{new Date(log.timestamp).toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})}</TableCell>
                                        <TableCell>{log.latitude}</TableCell>
                                        <TableCell>{log.longitude}</TableCell>
                                        <TableCell>{log.accuracy}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};

export default UserLocationLogs;