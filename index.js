const net = require('net');

// Server NTRIP
const ntripHost = 'nrtk.big.go.id';
const ntripPort = 2001;
const mountPoint = 'max-rtcm3';  // Ubah sesuai mount point yang diperlukan

// Username dan Password dalam base64
const base64Auth = Buffer.from('tgi456:tgi456').toString('base64');  // Ubah sesuai username:password

// Data GGA (seperti contoh yang diberikan)
let mostRecentGGA = "$GNGGA,043454.00,0754.8030033,S,11005.6762417,E,1,12,0.57,29.175,M,5.844,M,,*56";

// Membuat koneksi ke server NTRIP
const client = new net.Socket();

client.connect(ntripPort, ntripHost, () => {
    console.log(`Connected to ${ntripHost}:${ntripPort}`);
    
    // Membuat permintaan NTRIP
    const request = `GET /${mountPoint} HTTP/1.0\r\n` +
        `User-Agent: NTRIP NodeJS Client/1.0\r\n` +
        `Authorization: Basic ${base64Auth}\r\n` +
        `Accept: */*\r\n +`
        `Connection: close\r\n\r\n`;

    // Mengirim permintaan GET ke server NTRIP
    client.write(request);

    // Mengirim data GGA setelah beberapa detik (misalnya, setiap 5 detik)
    setInterval(() => {
        console.log(`Sending GGA: ${mostRecentGGA}`);
        client.write(mostRecentGGA + "\r\n");
    }, 5000);  // Mengirim setiap 5 detik (bisa diubah sesuai kebutuhan)
});

client.on('data', (data) => {
    console.log('Received data from server:');
    console.log(data.toString());

    // Data RTCM bisa diolah di sini
    // Misalnya, Anda bisa mengirim data ke perangkat Bluetooth atau menyimpan ke file
});

client.on('close', () => {
    console.log('Connection closed');
});

client.on('error', (err) => {
    console.error('Error: ', err);
});