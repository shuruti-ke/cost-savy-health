"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Database, Trash2, Loader2, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";

interface CsvFile {
  id: number;
  filename: string;
  hospital_name: string | null;
  row_count: number;
  uploaded_at: string;
  status: "done" | "processing" | "error";
  error_message: string | null;
}

interface ListResponse {
  total: number;
  items: CsvFile[];
}

const STATUS_ICON = {
  done: <CheckCircle className="w-4 h-4 text-green-500" />,
  processing: <Clock className="w-4 h-4 text-yellow-500" />,
  error: <XCircle className="w-4 h-4 text-red-500" />,
};

export default function CsvRepository() {
  const [data, setData] = useState<ListResponse>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/csv-files?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch {
      setError("Could not load CSV files.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number, filename: string) => {
    if (!confirm(`Delete "${filename}" and all its CPT rows from the database?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/csv-files/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await load();
    } catch {
      alert("Delete failed. Try again.");
    } finally {
      setDeleting(null);
    }
  };

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CSV Repository</h1>
          <p className="text-gray-500 mt-1">{data.total} file{data.total !== 1 ? "s" : ""} in database</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-5xl">
        {loading && data.items.length === 0 ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : data.items.length === 0 ? (
          <div className="text-center py-16">
            <Database className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No CSV files uploaded yet.</p>
            <a href="/admin/cpt-upload" className="text-[#6b2458] text-sm underline mt-2 block">Upload your first file →</a>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">File</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rows</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800 truncate max-w-xs" title={f.filename}>{f.filename}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{f.hospital_name || "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-gray-700">
                      {f.row_count > 0 ? f.row_count.toLocaleString() : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(f.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        f.status === "done" ? "bg-green-50 text-green-700" :
                        f.status === "error" ? "bg-red-50 text-red-700" :
                        "bg-yellow-50 text-yellow-700"
                      }`}>
                        {STATUS_ICON[f.status]} {f.status}
                      </span>
                      {f.status === "error" && f.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-xs truncate" title={f.error_message}>{f.error_message}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(f.id, f.filename)}
                        disabled={deleting === f.id}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        {deleting === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
