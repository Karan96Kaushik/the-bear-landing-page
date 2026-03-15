import React, { useState, useEffect } from 'react';
import { fetchAuthorizedData, postAuthorizedData } from '../api/api';
import GeneralTable from '../components/GeneralTable';
import { FileText, Loader2, AlertCircle, Trash2 } from 'lucide-react';

const CSVViewer = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emptying, setEmptying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadFiles = async () => {
      setListLoading(true);
      setError(null);
      try {
        const { files: fileList } = await fetchAuthorizedData('/files');
        if (!cancelled) setFiles(fileList || []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load file list');
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };
    loadFiles();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setHeaders([]);
      setRows([]);
      return;
    }
    let cancelled = false;
    const loadFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAuthorizedData(`/files/${encodeURIComponent(selectedFile)}`);
        if (!cancelled) {
          setHeaders(data.headers || []);
          setRows(data.rows || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load file');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadFile();
    return () => { cancelled = true; };
  }, [selectedFile]);

  const fields = headers.map(key => ({ key, label: key }));

  const handleEmptyLog = async () => {
    if (!selectedFile) return;
    setEmptying(true);
    setError(null);
    try {
      await postAuthorizedData(`/files/${encodeURIComponent(selectedFile)}/empty`, {});
      setHeaders([]);
      setRows([]);
    } catch (err) {
      setError(err?.message || 'Failed to empty file');
    } finally {
      setEmptying(false);
    }
  };

  return (
    <div className="bg-gray-900 dark:bg-gray-950 min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-6 text-white flex items-center gap-2">
          <FileText className="w-8 h-8" />
          CSV Logs
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-2 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select file
          </label>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            disabled={listLoading}
            className="w-full max-w-md px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Choose a file —</option>
            {files.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {listLoading && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading list…
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              Loading file…
            </div>
          ) : selectedFile && (headers.length > 0 || rows.length > 0) ? (
            <>
              <div className="px-6 py-3 border-b dark:border-gray-700 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedFile} — {rows.length} row{rows.length !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={handleEmptyLog}
                  disabled={emptying}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emptying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Empty log
                </button>
              </div>
              <div className="p-4">
                <GeneralTable
                  data={rows}
                  fields={fields}
                  stickyHeader
                  stickyFirstColumn
                  verticalBorders
                />
              </div>
            </>
          ) : selectedFile ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              No data in this file.
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              Select a file above to view its contents.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVViewer;
