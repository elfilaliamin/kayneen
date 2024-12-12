// Import required modules
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize Express app and WebSocket server
const app = express();
const apiPort = 3000;
const wsPort = 8080;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// WebSocket server configuration
const wss = new WebSocket.Server({ port: wsPort });
console.log(`WebSocket server running on ws://localhost:${wsPort}`);

// Serial port configuration
const serialPort = new SerialPort({
    path: 'COM5', // Update to your actual port
    baudRate: 9600
});
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

// Handle incoming serial data and broadcast via WebSocket
parser.on('data', (data) => {
    console.log(`Data received: ${data}`);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
});

serialPort.on('error', (err) => {
    console.error(`Error: ${err.message}`);
});

// Send commands to serial port
function sendCommand(command) {
    if (serialPort.isOpen) {
        serialPort.write(command + '\n', (err) => {
            if (err) {
                console.error(`Error on write: ${err.message}`);
            } else {
                console.log(`Sent: ${command}`);
            }
        });
    } else {
        console.error('Serial port is not open');
    }
}

// API endpoint to send a command to the serial port
app.get('/send-command', (req, res) => {
    const command = req.query.command;
    sendCommand(command);
    res.send(`Command "${command}" sent to serial port.`);
});

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '19992019',
    database: 'kayneen_database'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Endpoint to execute SQL commands
app.post('/execute-sql', (req, res) => {
    const query = req.body.query;
    db.query(query, (error, results) => {
        if (error) {
            console.error('Error executing query:', error);
            return res.status(500).json({ error: 'Database error: ' + error.message });
        }
        res.json({ results });
    });
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './src/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Endpoint to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded.' });
    }
    res.status(200).send({ message: 'Image uploaded successfully', filePath: req.file.path });
});

// Start API server
app.listen(apiPort, () => {
    console.log(`API server running at http://localhost:${apiPort}`);
});
