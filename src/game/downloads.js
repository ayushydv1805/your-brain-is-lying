/**
 * Download a generated text file. Native Android builds use the safe bridge to
 * save into Downloads; browsers and Electron use the standard download flow.
 */
export function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const safeFilename = String(filename || 'download.txt').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-');
  const text = String(content ?? '');

  if (typeof window !== 'undefined' && window.AndroidBridge?.saveTextFile) {
    try {
      window.AndroidBridge.saveTextFile(safeFilename, text, String(mimeType));
      return true;
    } catch (error) {
      console.warn('Native download failed; falling back to browser download:', error);
    }
  }

  try {
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFilename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (error) {
    console.error('Could not create download:', error);
    return false;
  }
}

