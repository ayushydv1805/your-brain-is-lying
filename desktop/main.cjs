const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const distDirectory = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDirectory, 'index.html');
const appDirectoryUrl = pathToFileURL(distDirectory + path.sep).href;

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 360,
    minHeight: 620,
    show: false,
    backgroundColor: '#080b16',
    autoHideMenuBar: true,
    title: 'Your Brain Is Lying',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  window.once('ready-to-show', () => window.show());

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => undefined);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(appDirectoryUrl)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url).catch(() => undefined);
  });

  window.webContents.on('will-attach-webview', (event) => event.preventDefault());

  window.loadFile(indexPath).catch((error) => {
    console.error('Could not open the packaged app:', error);
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.ayushyadav.yourbrainislying');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

