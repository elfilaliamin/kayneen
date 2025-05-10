// Required modules
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const fastcsv = require('fast-csv');
const multer = require('multer');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const WebSocket = require('ws');

// App + server config
const app = express();
const apiPort = 3000;
const wsPort = 8080;
app.use(cors());
app.use(express.json());

// WebSocket setup
const wss = new WebSocket.Server({ port: wsPort });
console.log(`✅ WebSocket running on ws://localhost:${wsPort}`);

// SerialPort setup
const serialPort = new SerialPort({ path: 'COM5', baudRate: 9600 }); // Change COM5 if needed
const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

serialPort.on('open', () => console.log('✅ Serial port open'));
serialPort.on('error', err => console.error('Serial port error:', err.message));

// Broadcast data to WebSocket clients
parser.on('data', data => {
    console.log('📟 Serial:', data);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
});

// Send command to serial
function sendCommand(command) {
    if (serialPort.isOpen) {
        serialPort.write(command + '\n', err => {
            if (err) console.error('Write error:', err.message);
            else console.log(`➡ Sent to Serial: ${command}`);
        });
    } else {
        console.error('❌ Serial port is not open');
    }
}

// Route: Send command via GET
app.get('/send-command', (req, res) => {
    const command = req.query.command;
    if (!command) return res.status(400).send('No command provided');
    sendCommand(command);
    res.send(`✅ Sent command: "${command}"`);
});

// === CSV Management ===
const dataDir = path.join(__dirname, 'src', 'data');
const requiredFiles = ['stdlist.csv', 'mjrlist.csv', 'abslist.csv'];
const headersMap = {
    'stdlist.csv': 'id,first_name,lastname,major,permission,img,abstime,data-st\n',
    'mjrlist.csv': 'id,major,full_major,data-st\n',
    'abslist.csv': 'id,dtccode,absents,presents\n'
};

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
requiredFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, headersMap[file]);
        console.log(`📝 Created ${file}`);
    }
});

function readCSV(filePath, skipIgnored = true) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', row => {
                if (!skipIgnored || row['data-st'] !== 'ignor') {
                    results.push(row);
                }
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

function writeCSV(filePath, data) {
    return new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(filePath);
        fastcsv.write(data, { headers: true })
            .pipe(ws)
            .on('finish', resolve)
            .on('error', reject);
    });
}

// API: Get all rows
app.get('/csv/:filename', async (req, res) => {
    try {
        const filePath = path.join(dataDir, req.params.filename);
        const rows = await readCSV(filePath);
        res.json(rows);
    } catch {
        res.status(500).json({ error: 'Failed to read CSV' });
    }
});

// API: Add row
app.post('/csv/:filename', async (req, res) => {
    const filePath = path.join(dataDir, req.params.filename);
    const newData = req.body.data;
    try {
        const rows = await readCSV(filePath, false);
        const headers = rows.length
            ? Object.keys(rows[0])
            : headersMap[req.params.filename].trim().split(',');
        const newId = rows.length ? Math.max(...rows.map(r => parseInt(r.id))) + 1 : 1;
        const newRow = { id: String(newId) };
        headers.forEach(h => {
            if (h !== 'id') newRow[h] = newData[h] || '';
        });
        rows.push(newRow);
        await writeCSV(filePath, rows);
        res.json({ success: true, id: newId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add row' });
    }
});

// API: Update row
app.put('/csv/:filename/:id', async (req, res) => {
    const filePath = path.join(dataDir, req.params.filename);
    try {
        const rows = await readCSV(filePath, false);
        const idx = rows.findIndex(r => r.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'ID not found' });
        rows[idx] = { ...rows[idx], ...req.body.data };
        await writeCSV(filePath, rows);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update row' });
    }
});

// API: Soft delete row
app.delete('/csv/:filename/:id', async (req, res) => {
    const filePath = path.join(dataDir, req.params.filename);
    try {
        const rows = await readCSV(filePath, false);
        const idx = rows.findIndex(r => r.id === req.params.id);
        if (idx === -1) return res.status(404).json({ error: 'ID not found' });
        rows[idx]['data-st'] = 'ignor';
        await writeCSV(filePath, rows);
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete row' });
    }
});

// === Image Upload ===
const imageUploadPath = path.join(__dirname, 'src', 'images', 'upload');
if (!fs.existsSync(imageUploadPath)) {
    fs.mkdirSync(imageUploadPath, { recursive: true });
}
const upload = multer({ dest: imageUploadPath });

app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = path.extname(req.file.originalname);
    const customName = req.body.filename || 'uploaded';
    const newFilename = customName + ext;
    const newPath = path.join(imageUploadPath, newFilename);
    fs.rename(req.file.path, newPath, err => {
        if (err) return res.status(500).json({ error: 'Rename failed' });
        res.json({ success: true, filename: newFilename });
    });
});

// API: Increment abstime by 2.5 for a list of IDs
app.post('/csv/stdlist/increment-abstime', async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'Invalid or missing "ids" array in request body' });
    }

    const filePath = path.join(dataDir, 'stdlist.csv');
    try {
        const rows = await readCSV(filePath, false);
        let updatedCount = 0;

        for (const row of rows) {
            if (ids.includes(row.id)) {
                const current = parseFloat(row.abstime);
                row.abstime = isNaN(current) ? '2.5' : (current + 2.5).toString();
                row.permission = "Not Allowed";
                updatedCount++;
            }
        }

        await writeCSV(filePath, rows);
        res.json({ success: true, updated: updatedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update abstime' });
    }
});


// Start API server
app.listen(apiPort, () => {
    console.log(`🚀 API server running at http://localhost:${apiPort}`);
});
