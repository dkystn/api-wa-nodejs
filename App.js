const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');

// API Key yang valid
const validApiKeys = ['diky)(*&^-98356-api-key-1']; // Ganti dengan API keys Anda

// Inisialisasi Express dan Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json()); // Parsing JSON request body
app.use(express.static('public')); // Menyajikan file statis dari folder 'public'

// Middleware untuk memeriksa API key
function checkApiKey(req, res, next) {
    const apiKey = req.headers['api-key']; // Mengambil API key dari header
    if (!apiKey || !validApiKeys.includes(apiKey)) {
        return res.status(403).json({ error: 'API key tidak valid!' });
    }
    next(); // Lanjutkan ke middleware berikutnya
}

// Inisialisasi WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
});

// Event ketika QR code diterima
client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (err) {
            console.error('Gagal membuat QR code:', err);
            return;
        }
        io.emit('qr', url); // Kirim QR code ke semua klien yang terhubung
    });
});

// Event ketika client siap
client.on('ready', () => {
    console.log('WhatsApp Client siap!');
    io.emit('ready', 'WhatsApp Client siap!'); // Kirim status ke klien
});

// API endpoint untuk mengirim pesan
app.post('/send-message', checkApiKey, async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ error: 'Nomor dan pesan harus diisi!' });
    }

    const chatId = `${number}@c.us`; // Format ID WhatsApp

    try {
        await client.sendMessage(chatId, message); // Kirim pesan
        res.status(200).json({ success: true, message: 'Pesan berhasil dikirim!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Gagal mengirim pesan.' });
    }
});

// Mulai client WhatsApp
client.initialize();

// Jalankan server pada port 3000
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
