import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Get current active JWT token
 */
export const getAuthToken = () => {
  return (
    useAuthStore.getState().accessToken ||
    localStorage.getItem('zitouni_access_token') ||
    localStorage.getItem('token') ||
    ''
  );
};

/**
 * Append authentication token to any URL so direct browser window.open / <a> links authenticate
 */
export const getAuthorizedUrl = (url) => {
  if (!url) return '';
  const token = getAuthToken();
  if (!token) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
};

/**
 * Open authenticated URL in a new browser tab/window for direct printing or preview
 */
export const openAuthorizedUrl = (url, target = '_blank') => {
  if (!url) return;
  const authUrl = getAuthorizedUrl(url);
  window.open(authUrl, target);
};

/**
 * Download file via authenticated Axios request and trigger browser save
 */
export const downloadAuthorizedFile = async (url, defaultFilename = 'document.pdf') => {
  try {
    const response = await axios.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/octet-stream',
    });

    // Try extracting filename from Content-Disposition header if available
    let filename = defaultFilename;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error('Error downloading authorized file:', err);
    // Fallback to opening authorized URL directly
    openAuthorizedUrl(url);
  }
};
