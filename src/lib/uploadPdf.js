import { API_BASE } from './api';

/** PUT the raw PDF with upload progress (catalogue by default, or another document path). */
export function uploadPdf(file, onProgress, path = '/catalogue/admin/file') {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `${API_BASE}${path}?filename=${encodeURIComponent(file.name)}`);
    const token = localStorage.getItem('token');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.onload = () => {
      let json = {};
      try { json = JSON.parse(xhr.responseText); } catch { /* non-JSON error */ }
      if (xhr.status >= 200 && xhr.status < 300 && json.success) resolve(json.data);
      else reject(new Error(json.error || (xhr.status === 413 ? 'PDF is too large' : 'Upload failed')));
    };
    xhr.send(file);
  });
}
