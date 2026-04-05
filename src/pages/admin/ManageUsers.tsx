import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../../api";
import type { AxiosResponse } from "axios";
import AdminSidebar from "../../components/AdminSidebar";
import "./ManageUsers.css";

/* ─────── Updated: keep your CSS string here ─────── */
const css = `
// ...[styles unchanged for brevity; paste your full CSS here]...
`;

/* ─────────────────────────── Types ─────────────────────────── */
type User = {
  _id: string; name?: string; email?: string;
  role?: string; active?: boolean; createdAt?: string;
};

const PAGE_SIZES = [10, 25, 50];

/* ─────────────────────────── Component ─────────────────────────── */
export default function ManageUsers(): React.ReactElement {
  const [users,       setUsers]       = useState<User[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [q,           setQ]           = useState("");
  const [debouncedQ,  setDebouncedQ]  = useState("");
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState<number>(PAGE_SIZES[0]);
  const [sortBy,      setSortBy]      = useState<"createdAt"|"name">("createdAt");
  const [sortDir,     setSortDir]     = useState<"desc"|"asc">("desc");
  const [rowLoading,  setRowLoading]  = useState<Record<string, boolean>>({});
  const [modalDelete, setModalDelete] = useState<{ id: string; name?: string } | null>(null);
  const [modalEdit,   setModalEdit]   = useState<{ id: string; name?: string; email?: string; role?: string; active?: boolean } | null>(null);
  const [toast,       setToast]       = useState<{ text: string; danger?: boolean } | null>(null);

  const abortRef      = useRef<AbortController | null>(null);
  const debounceTimer = useRef<number | null>(null);
  const qRef          = useRef(q);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError(null);
    try {
      const res: AxiosResponse<User[] | { data: User[] }> = await api.get("/admin/users", { signal: ctrl.signal as any });
      const data: User[] = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
      setUsers(data); setPage(1);
    } catch (err: any) {
      if (err?.name === "CanceledError" || err?.message === "canceled") return;
      setError(err?.response?.data?.message || "Failed to load users");
      setUsers([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    return () => { abortRef.current?.abort(); if (debounceTimer.current) window.clearTimeout(debounceTimer.current); };
  }, [load]);

  useEffect(() => {
    qRef.current = q;
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => { setDebouncedQ(qRef.current); setPage(1); }, 250);
    return () => { if (debounceTimer.current) window.clearTimeout(debounceTimer.current); };
  }, [q]);

  const processed = useMemo(() => {
    const ql = debouncedQ.trim().toLowerCase();
    let list = users.slice();

    // 🚩 Only include users with role === "user"
    list = list.filter((u) => u.role === "user");

    if (ql) list = list.filter((u) => [u.name, u.email, u._id].some((v) => (v ?? "").toLowerCase().includes(ql)));
    list.sort((a, b) => {
      if (sortBy === "createdAt") {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortDir === "desc" ? db - da : da - db;
      }
      const na = (a.name ?? "").toLowerCase(), nb = (b.name ?? "").toLowerCase();
      if (na < nb) return sortDir === "desc" ? 1 : -1;
      if (na > nb) return sortDir === "desc" ? -1 : 1;
      return 0;
    });
    return list;
  }, [users, debouncedQ, sortBy, sortDir]);

  const pageCount   = Math.max(1, Math.ceil(processed.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageItems   = useMemo(() => processed.slice((currentPage-1)*pageSize, currentPage*pageSize), [processed, currentPage, pageSize]);

  const showToast  = (text: string, danger = false, ttl = 3500) => { setToast({ text, danger }); setTimeout(() => setToast(null), ttl); };
  const setRowBusy = (id: string, busy: boolean) => setRowLoading((s) => { const c = { ...s }; if (busy) c[id] = true; else delete c[id]; return c; });

  async function toggleActive(userId: string, current: boolean | undefined) {
    setRowBusy(userId, true);
    const prev = users;
    setUsers((s) => s.map((u) => u._id === userId ? { ...u, active: !current } : u));
    try {
      await api.patch(`/admin/users/${userId}/active`, { active: !current });
      showToast(!current ? "User enabled" : "User disabled");
    } catch (err: any) {
      setUsers(prev);
      showToast(err?.response?.data?.message || "Failed to update user", true);
    } finally { setRowBusy(userId, false); }
  }

  async function changeRole(userId: string, newRole: string) {
    setRowBusy(userId, true);
    const prev = users;
    setUsers((s) => s.map((u) => u._id === userId ? { ...u, role: newRole } : u));
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      showToast("Role updated");
    } catch (err: any) {
      setUsers(prev);
      showToast(err?.response?.data?.message || "Failed to update role", true);
    } finally { setRowBusy(userId, false); }
  }

  async function confirmRemove() {
    if (!modalDelete) return;
    const id = modalDelete.id;
    setRowBusy(id, true);
    const prev = users;
    setUsers((s) => s.filter((u) => u._id !== id));
    setModalDelete(null);
    try {
      await api.delete(`/admin/users/${id}`);
      showToast("User deleted");
    } catch (err: any) {
      setUsers(prev);
      showToast(err?.response?.data?.message || "Failed to delete user", true);
    } finally { setRowBusy(id, false); }
  }

  function openEditModal(u: User) {
    setModalEdit({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: !!u.active,
    });
  }

  async function saveEdit() {
    if (!modalEdit) return;
    const { id, name, email, role, active } = modalEdit;
    setRowBusy(id, true);
    const prev = users;
    setUsers((s) => s.map((u) => u._id === id ? { ...u, name, email, role, active } : u));
    try {
      const res = await api.patch(`/admin/users/${id}`, { name, email, role, active });
      const updated: User | null = res?.data?.user ?? res?.data?.updatedUser ?? res?.data ?? null;
      if (updated && typeof updated === "object") {
        setUsers((s) => s.map((u) => u._id === id ? { ...u, ...updated } : u));
      }
      showToast("User updated");
      setModalEdit(null);
    } catch (err: any) {
      setUsers(prev);
      showToast(err?.response?.data?.message || "Failed to update user", true);
    } finally {
      setRowBusy(id, false);
    }
  }

  function exportCSV(list: User[], fileSuffix = "users") {
    if (!list.length) { alert("No rows to export"); return; }
    const header = ["ID","Name","Email","Role","Active","Joined"];
    const rows   = list.map((r) =>
      [r._id, r.name ?? "", r.email ?? "", r.role ?? "", r.active ? "yes" : "no",
       r.createdAt ? new Date(r.createdAt).toLocaleString() : ""]
      .map((v) => `"${String(v).replace(/"/g,'""')}"`).join(",")
    );
    const csv  = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `${fileSuffix}_${new Date().toISOString().slice(0,10)}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString() : "—";

  return (
    <>
      <style>{css}</style>

      <div className="admin-page" style={{ display: "flex", minHeight: "100vh", background: "var(--bg, #fff)" }}>
        <AdminSidebar />

        <main className="admin-main" style={{ flex: 1 }}>
          <div className="mu-page">

            {/* ── Header ── */}
            <div className="mu-header">
              <div>
                <h2 className="mu-title">Manage Users</h2>
                <div className="mu-sub">{processed.length} result{processed.length !== 1 ? "s" : ""}</div>
              </div>
              <div className="mu-header__right">
                <button className="mu-btn mu-btn--primary" onClick={load} disabled={loading}>
                  ↻ Refresh
                </button>
              </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="mu-toolbar">
              <input
                className="mu-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email or ID…"
                aria-label="Search users"
              />

              <div className="mu-sort-group">
                <span className="mu-sort-label">Sort</span>
                <select className="mu-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} aria-label="Sort by">
                  <option value="createdAt">Joined</option>
                  <option value="name">Name</option>
                </select>
                <button className="mu-btn mu-btn--sm" onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")} aria-label="Toggle sort direction">
                  {sortDir === "desc" ? "↓ Desc" : "↑ Asc"}
                </button>
              </div>

              <div className="mu-toolbar__right">
                <span className="mu-sort-label">Per page</span>
                <select className="mu-select" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="Page size">
                  {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="mu-btn mu-btn--sm" onClick={() => exportCSV(processed, "users_filtered")}>↓ Filtered</button>
                <button className="mu-btn mu-btn--sm" onClick={() => exportCSV(users, "users_all")}>↓ All</button>
              </div>
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="mu-error">
                ⚠ {error}
                <button className="mu-btn mu-btn--sm" onClick={load} style={{ marginLeft: 8 }}>Retry</button>
              </div>
            )}

            {/* ── Loading ── */}
            {loading && <div className="mu-loading">Loading users…</div>}

            {/* ── Table ── */}
            {!loading && !error && (
              <>
                <div className="mu-table-wrap">
                  <table className="mu-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length === 0 ? (
                        <tr className="mu-empty-row">
                          <td colSpan={6}>No users found.</td>
                        </tr>
                      ) : pageItems.map((u) => (
                        <tr key={u._id} className={rowLoading[u._id] ? "mu-row-busy" : ""}>
                          <td>{u.name ?? "—"}</td>
                          <td>
                            <a href={`mailto:${u.email}`} className="mu-email-link">{u.email ?? "—"}</a>
                          </td>
                          <td>
                            <select
                              className="mu-role-select"
                              value={u.role ?? ""}
                              onChange={(e) => changeRole(u._id, e.target.value)}
                              disabled={!!rowLoading[u._id]}
                              aria-label={`Change role for ${u.name ?? u.email}`}
                            >
                              <option value="">—</option>
                              <option value="admin">admin</option>
                              <option value="collector">collector</option>
                              <option value="user">user</option>
                            </select>
                          </td>
                          <td><span className="mu-date">{fmtDate(u.createdAt)}</span></td>
                          <td>
                            <button
                              className={`mu-status-btn ${u.active ? "mu-status-btn--on" : "mu-status-btn--off"}`}
                              onClick={() => toggleActive(u._id, u.active)}
                              disabled={!!rowLoading[u._id]}
                              aria-pressed={!!u.active}
                              aria-label={`${u.active ? "Disable" : "Enable"} ${u.name ?? u.email}`}
                            >
                              {rowLoading[u._id] ? "…" : u.active ? "● Enabled" : "○ Disabled"}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                              <button
                                className="mu-btn mu-btn--sm"
                                onClick={() => openEditModal(u)}
                                disabled={!!rowLoading[u._id]}
                              >
                                Edit
                              </button>
                              <button
                                className="mu-delete-btn"
                                onClick={() => setModalDelete({ id: u._id, name: u.name })}
                                disabled={!!rowLoading[u._id]}
                                aria-label={`Delete ${u.name ?? u.email}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* ── Pagination ── */}
                <div className="mu-pagination">
                  <div className="mu-pagination__controls">
                    <button className="mu-btn mu-btn--sm" onClick={() => setPage((p) => Math.max(1,p-1))} disabled={currentPage === 1} aria-label="Previous page">
                      ← Prev
                    </button>
                    <span className="mu-pagination__page">{currentPage} / {pageCount}</span>
                    <button className="mu-btn mu-btn--sm" onClick={() => setPage((p) => Math.min(pageCount,p+1))} disabled={currentPage === pageCount} aria-label="Next page">
                      Next →
                    </button>
                  </div>
                  <span className="mu-pagination__info">
                    {pageItems.length} of {processed.length} filtered
                  </span>
                </div>
              </>
            )}

            {/* ── Delete modal ── */}
            {modalDelete && (
              <div className="mu-overlay" role="dialog" aria-modal="true" aria-labelledby="mu-modal-title">
                <div className="mu-modal">
                  <h3 className="mu-modal__title" id="mu-modal-title">Delete user</h3>
                  <p className="mu-modal__body">
                    Permanently delete <strong>{modalDelete.name ?? modalDelete.id}</strong>? This cannot be undone.
                  </p>
                  <div className="mu-modal__footer">
                    <button className="mu-btn" onClick={() => setModalDelete(null)}>Cancel</button>
                    <button className="mu-btn mu-btn--danger" onClick={confirmRemove}>Yes, delete</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Edit modal ── */}
            {modalEdit && (
              <div className="mu-overlay" role="dialog" aria-modal="true" aria-labelledby="mu-edit-title">
                <div className="mu-modal" style={{ maxWidth: 640 }}>
                  <h3 className="mu-modal__title" id="mu-edit-title">Edit user</h3>

                  <div className="mu-modal__body">
                    <div style={{ display: "grid", gap: 10 }}>
                      <label>
                        <div style={{ fontSize: 13, marginBottom: 6 }}>Name</div>
                        <input
                          type="text"
                          value={modalEdit.name ?? ""}
                          onChange={(e) => setModalEdit((m) => m ? { ...m, name: e.target.value } : m)}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                      </label>

                      <label>
                        <div style={{ fontSize: 13, marginBottom: 6 }}>Email</div>
                        <input
                          type="email"
                          value={modalEdit.email ?? ""}
                          onChange={(e) => setModalEdit((m) => m ? { ...m, email: e.target.value } : m)}
                          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)" }}
                        />
                      </label>

                      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ minWidth: 84, fontSize: 13 }}>Role</div>
                        <select
                          value={modalEdit.role ?? ""}
                          onChange={(e) => setModalEdit((m) => m ? { ...m, role: e.target.value } : m)}
                          className="mu-select"
                          style={{ flex: 1 }}
                        >
                          <option value="">—</option>
                          <option value="admin">admin</option>
                          <option value="collector">collector</option>
                          <option value="user">user</option>
                        </select>
                      </label>

                      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ minWidth: 84, fontSize: 13 }}>Active</div>
                        <button
                          className={`mu-status-btn ${modalEdit.active ? "mu-status-btn--on" : "mu-status-btn--off"}`}
                          onClick={() => setModalEdit((m) => m ? { ...m, active: !m.active } : m)}
                          type="button"
                        >
                          {modalEdit.active ? "● Enabled" : "○ Disabled"}
                        </button>
                      </label>
                    </div>
                  </div>

                  <div className="mu-modal__footer">
                    <button className="mu-btn" onClick={() => setModalEdit(null)}>Cancel</button>
                    <button
                      className="mu-btn mu-btn--primary"
                      onClick={saveEdit}
                      disabled={!modalEdit?.name || !modalEdit?.email}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Toast ── */}
            {toast && (
              <div className="mu-toast" role="status" aria-live={toast.danger ? "assertive" : "polite"}>
                <div className={`mu-toast__inner ${toast.danger ? "mu-toast__inner--danger" : "mu-toast__inner--info"}`}>
                  {toast.text}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </>
  );
}