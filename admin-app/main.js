// admin-app/main.js - SEKARANG MENJADI KLIEN MURNI

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const dgram = require('dgram');

// Semua kode yang berhubungan dengan 'fork' dan 'startBackend' sudah dihapus

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      // Path ke preload.js sekarang menunjuk ke dalam folder 'renderer'
      preload: path.join(__dirname, 'renderer', 'preload.js') 
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'public', 'admin.html'));
}

// Langsung membuat jendela, tidak perlu menunggu backend
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Handler 'before-quit' yang mematikan server sudah tidak diperlukan dan dihapus

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handler deteksi server tetap ada, karena Admin App perlu mencari server
ipcMain.handle('find-server', () => {
  return new Promise((resolve, reject) => {
    const socket = dgram.createSocket('udp4');
    const discoveryMessage = 'DISCOVER_ANTRIAN_SERVER';
    const DISCOVERY_PORT = 41234;
    const timeout = setTimeout(() => { socket.close(); reject(new Error('Server tidak ditemukan (timeout).')); }, 5000);
    socket.on('error', (err) => { clearTimeout(timeout); socket.close(); reject(err); });
    socket.on('message', (msg) => {
      try {
        const serverInfo = JSON.parse(msg.toString());
        if (serverInfo.ip && serverInfo.port) {
          clearTimeout(timeout);
          socket.close();
          resolve(serverInfo);
        }
      } catch (e) { /* Abaikan */ }
    });
    socket.bind(() => {
      socket.setBroadcast(true);
      socket.send(discoveryMessage, DISCOVERY_PORT, '255.255.255.255', (err) => {
        if (err) { clearTimeout(timeout); socket.close(); reject(err); }
      });
    });
  });
});

