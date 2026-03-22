import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { fetchAuthorizedData, postAuthorizedData } from '../api/api';
import GeneralTable from '../components/GeneralTable';
import {
  FileText,
  Loader2,
  AlertCircle,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Filter,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];
const SEARCH_DEBOUNCE_MS = 350;

const CSVViewer = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValueInput, setFilterValueInput] = useState('');
  const [debouncedFilterValue, setDebouncedFilterValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emptying, setEmptying] = useState(false);
  const [reverseOrder, setReverseOrder] = useState(false);

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
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilterValue(filterValueInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filterValueInput]);

  const filterKey = useMemo(
    () =>
      `${selectedFile}|${debouncedSearch}|${filterColumn}|${debouncedFilterValue}|${pageSize}|${reverseOrder}`,
    [selectedFile, debouncedSearch, filterColumn, debouncedFilterValue, pageSize, reverseOrder]
  );

  useLayoutEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedFile) {
        setHeaders([]);
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
        });
        if (debouncedSearch) params.set('q', debouncedSearch);
        if (filterColumn && debouncedFilterValue) {
          params.set('filterColumn', filterColumn);
          params.set('filterValue', debouncedFilterValue);
        }
        if (reverseOrder) params.set('reverse', '1');
        const path = `/files/${encodeURIComponent(selectedFile)}?${params.toString()}`;
        const data = await fetchAuthorizedData(path);
        if (cancelled) return;
        setHeaders(data.headers || []);
        setRows(data.rows || []);
        const t = typeof data.total === 'number' ? data.total : (data.rows || []).length;
        const tp = typeof data.totalPages === 'number' ? data.totalPages : 1;
        setTotal(t);
        setTotalPages(Math.max(1, tp));
        if (typeof data.page === 'number' && data.page >= 1 && data.page !== page) {
          setPage(data.page);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load file');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    selectedFile,
    page,
    pageSize,
    debouncedSearch,
    filterColumn,
    debouncedFilterValue,
    reverseOrder,
  ]);

  const fields = headers.map((key) => ({ key, label: key }));

  const handleEmptyLog = async () => {
    if (!selectedFile) return;
    setEmptying(true);
    setError(null);
    try {
      await postAuthorizedData(`/files/${encodeURIComponent(selectedFile)}/empty`, {});
      setHeaders([]);
      setRows([]);
      setTotal(0);
      setTotalPages(1);
      setPage(1);
    } catch (err) {
      setError(err?.message || 'Failed to empty file');
    } finally {
      setEmptying(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.value);
    setSearchInput('');
    setDebouncedSearch('');
    setFilterColumn('');
    setFilterValueInput('');
    setDebouncedFilterValue('');
    setReverseOrder(false);
  };

  const hasActiveFilters = Boolean(debouncedSearch || (filterColumn && debouncedFilterValue));
  const showTableBlock = selectedFile && (headers.length > 0 || total > 0 || hasActiveFilters);

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
            onChange={handleFileChange}
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
          ) : showTableBlock ? (
            <>
              <div className="px-4 sm:px-6 py-3 border-b dark:border-gray-700 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {selectedFile} — {total.toLocaleString()} row{total !== 1 ? 's' : ''}
                    {hasActiveFilters ? ' (filtered)' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleEmptyLog}
                    disabled={emptying}
                    className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {emptying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Empty log
                  </button>
                </div>
                <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Search all columns
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="search"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Type to search…"
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end flex-1 min-w-0">
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                        <Filter className="w-3 h-3" />
                        Filter column
                      </label>
                      <select
                        value={filterColumn}
                        onChange={(e) => {
                          setFilterColumn(e.target.value);
                          if (!e.target.value) {
                            setFilterValueInput('');
                            setDebouncedFilterValue('');
                          }
                        }}
                        disabled={headers.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        <option value="">Any (use search)</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Column contains
                      </label>
                      <input
                        type="text"
                        value={filterValueInput}
                        onChange={(e) => setFilterValueInput(e.target.value)}
                        placeholder={filterColumn ? 'Value…' : 'Pick a column'}
                        disabled={!filterColumn}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        autoComplete="off"
                      />
                    </div>
                    <div className="sm:w-28">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Page size
                      </label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                      >
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:min-w-[140px] flex items-end pb-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={reverseOrder}
                          onChange={(e) => setReverseOrder(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                        />
                        Reverse order
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-3 border-b dark:border-gray-700 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                  {total > 0 && (
                    <span className="text-gray-500 dark:text-gray-500">
                      {' '}
                      (showing {(page - 1) * pageSize + 1}–
                      {Math.min(page * pageSize, total)} of {total.toLocaleString()})
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    disabled={page >= totalPages || loading}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {rows.length > 0 ? (
                  <GeneralTable
                    data={rows}
                    fields={fields}
                    stickyHeader
                    stickyFirstColumn
                    verticalBorders
                  />
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {hasActiveFilters
                      ? 'No rows match your search or filter.'
                      : 'No data in this file.'}
                  </p>
                )}
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
