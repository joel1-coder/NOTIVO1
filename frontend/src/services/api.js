// API Service Configuration
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls — 3 second timeout so pages never hang
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out — server too slow or offline');
    }
    console.error('API Error:', error);
    throw error;
  }
};

// User API
export const userAPI = {
  login: (email, password) => 
    apiCall('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  getAllUsers: () => 
    apiCall('/users', { method: 'GET' }),
  
  createUser: (userData) => 
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  
  deleteUser: (userId) => 
    apiCall(`/users/${userId}`, { method: 'DELETE' }),
    
  updateUser: (userId, userData) =>
    apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
};

// Task API
export const taskAPI = {
  getAllTasks: () => 
    apiCall('/tasks', { method: 'GET' }),
  
  getTaskById: (taskId) => 
    apiCall(`/tasks/${taskId}`, { method: 'GET' }),
  
  createTask: (taskData) => 
    apiCall('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  
  updateTask: (taskId, taskData) => 
    apiCall(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    }),
  
  deleteTask: (taskId) => 
    apiCall(`/tasks/${taskId}`, { method: 'DELETE' }),
};

// Template API
export const templateAPI = {
  getAllTemplates: () => 
    apiCall('/templates', { method: 'GET' }),
  
  createTemplate: (templateData) => 
    apiCall('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    }),
};

// Submission API
export const submissionAPI = {
  getAllSubmissions: () => 
    apiCall('/submissions', { method: 'GET' }),
  
  getSubmissionById: (submissionId) => 
    apiCall(`/submissions/${submissionId}`, { method: 'GET' }),
  
  createSubmission: (submissionData) => 
    apiCall('/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    }),
  
  updateSubmission: (submissionId, submissionData) => 
    apiCall(`/submissions/${submissionId}`, {
      method: 'PUT',
      body: JSON.stringify(submissionData),
    }),
};

// Export utility for Excel/CSV/Word
export const exportAPI = {
  exportToCSV: (data, filename = 'export.csv') => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...data.map(row => 
        headers.map(h => `"${row[h] || ''}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportToExcel: (data, filename = 'export.xlsx') => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook  = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

      // Auto-fit column widths
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          if (worksheet[addr]?.v) maxLen = Math.max(maxLen, worksheet[addr].v.toString().length);
        }
        colWidths.push({ wch: Math.min(maxLen + 2, 30) });
      }
      worksheet['!cols'] = colWidths;

      // Browser-safe download via Blob
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob  = new Blob([wbout], { type: 'application/octet-stream' });
      const link  = document.createElement('a');
      link.href   = URL.createObjectURL(blob);
      link.download = `${filename.replace('.xlsx', '')}_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Excel export failed:', error);
      exportAPI.exportToCSV(data, filename.replace('.xlsx', '.csv'));
    }
  },

  exportToJSON: (data, filename = 'export.json') => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // ── Export submission modal data (filled form) as a proper table ────────────
  // data:   flat object { "Row 1 — Subject / Task": val, "Row 1 — Due Date": val, … }
  // meta:   { user, email, template, submittedAt, status }
  exportSubmissionAsExcel: (data, meta, filename = 'submission.xlsx') => {
    try {
      // ── Parse flat keys like "Row 1 — Subject / Task" into rows × columns ──
      // Using indexOf split — avoids any regex/encoding issues with em dash char
      const rowMap  = {};
      const colOrder = [];   // preserve insertion order
      const colSeen  = new Set();

      Object.entries(data || {}).forEach(([key, val]) => {
        // Find the separator: space + em dash + space (any single dash variant)
        // Try ' — ', ' – ', ' - ' in that order
        let sep = ' — ';
        let si  = key.indexOf(sep);
        if (si < 0) { sep = ' – '; si = key.indexOf(sep); }
        if (si < 0) { sep = ' - '; si = key.indexOf(sep); }

        if (si > 0) {
          const prefix  = key.substring(0, si);          // "Row 1"
          const colName = key.substring(si + sep.length); // "Subject / Task"
          const rowMatch = prefix.match(/^Row (\d+)$/);
          if (rowMatch) {
            const rn = parseInt(rowMatch[1]);
            if (!colSeen.has(colName)) { colSeen.add(colName); colOrder.push(colName); }
            if (!rowMap[rn]) rowMap[rn] = { '#': rn };
            rowMap[rn][colName] = val;
          }
        }
      });

      const cols = ['#', ...colOrder];
      const rows = Object.keys(rowMap)
        .sort((a, b) => Number(a) - Number(b))
        .map(k => rowMap[k]);

      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Submission Info ──
      const infoRows = [
        { Field: 'Template',     Value: meta.template    || '' },
        { Field: 'Submitted By', Value: meta.user        || '' },
        { Field: 'Email',        Value: meta.email       || '' },
        { Field: 'Submitted At', Value: meta.submittedAt || '' },
        { Field: 'Status',       Value: meta.status      || '' },
      ];
      const wsInfo = XLSX.utils.json_to_sheet(infoRows);
      wsInfo['!cols'] = [{ wch: 18 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsInfo, 'Submission Info');

      // ── Sheet 2: Form Data as proper table ──
      if (rows.length > 0) {
        // aoa = array of arrays keeps exact column order
        const aoa = [
          cols,                                          // header row
          ...rows.map(r => cols.map(c => r[c] ?? '')),  // data rows
        ];
        const wsData = XLSX.utils.aoa_to_sheet(aoa);

        // Auto-fit column widths
        wsData['!cols'] = cols.map(col => {
          let maxLen = col.length;
          rows.forEach(r => {
            const v = String(r[col] ?? '');
            if (v.length > maxLen) maxLen = v.length;
          });
          return { wch: Math.min(maxLen + 4, 40) };
        });

        XLSX.utils.book_append_sheet(wb, wsData, 'Form Data');
      }

      // ── Browser-safe download (works in Vite/browser, unlike XLSX.writeFile) ──
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob  = new Blob([wbout], { type: 'application/octet-stream' });
      const link  = document.createElement('a');
      link.href   = URL.createObjectURL(blob);
      link.download = `${filename.replace('.xlsx', '')}_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Excel export failed: ' + err.message);
    }
  },

  exportSubmissionAsWord: (data, meta, filename = 'submission.doc') => {
    // Build a Word-compatible HTML document with tables
    const rowMap = {};
    const colSet = new Set();
    Object.entries(data).forEach(([key, val]) => {
      const match = key.match(/^Row (\d+) — (.+)$/);
      if (match) {
        const rowNum = parseInt(match[1]);
        const colName = match[2];
        colSet.add(colName);
        if (!rowMap[rowNum]) rowMap[rowNum] = {};
        rowMap[rowNum][colName] = val;
      }
    });
    const cols = Array.from(colSet);
    const rows = Object.keys(rowMap).sort((a, b) => Number(a) - Number(b));

    const headerStyle = 'background:#1E40AF;color:#fff;font-weight:bold;padding:8px 12px;border:1px solid #1E40AF;text-align:center;';
    const cellStyle   = 'padding:7px 12px;border:1px solid #CBD5E1;font-size:13px;';
    const rowEven     = '#F8FAFC';

    const infoRows = [
      ['Template',     meta.template || ''],
      ['Submitted By', meta.user     || ''],
      ['Email',        meta.email    || ''],
      ['Submitted At', meta.submittedAt || ''],
      ['Status',       meta.status   || ''],
    ];

    const infoHtml = infoRows.map(([k, v]) =>
      `<tr><td style="${cellStyle}font-weight:600;color:#475569;width:160px">${k}</td><td style="${cellStyle}">${v}</td></tr>`
    ).join('');

    const dataHeader = `<tr><th style="${headerStyle}width:50px">#</th>${cols.map(c => `<th style="${headerStyle}">${c}</th>`).join('')}</tr>`;
    const dataRows = rows.map((rk, i) =>
      `<tr style="background:${i % 2 === 0 ? '#fff' : rowEven}">
        <td style="${cellStyle}font-weight:700;color:#64748B;text-align:center">${rk}</td>
        ${cols.map(c => `<td style="${cellStyle}">${rowMap[rk][c] || ''}</td>`).join('')}
      </tr>`
    ).join('');

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'>
      <style>
        body { font-family: Calibri, Arial, sans-serif; margin: 32px; color: #0F172A; }
        h1   { font-size: 20px; color: #1E40AF; margin-bottom: 4px; }
        h2   { font-size: 14px; color: #475569; margin: 24px 0 8px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
      </style>
      </head><body>
        <h1>📋 Submission Details</h1>
        <h2>Submission Information</h2>
        <table>${infoHtml}</table>
        <h2>Filled Form Data</h2>
        <table>${dataHeader}${dataRows}</table>
      </body></html>
    `;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename.replace('.doc', '')}_${new Date().toISOString().slice(0,10)}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

export default apiCall;
