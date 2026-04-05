import React, { useMemo, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import "./CreateCertificate.css";

/* Simple scoped styles so this component looks nicer out of the box */
const css = `
.create-cert {
  max-width: 820px;
  margin: 18px auto;
  padding: 20px;
  background: linear-gradient(180deg,#fff,#fbfffb);
  border-radius: 12px;
  border: 1px solid rgba(12,36,18,0.04);
  box-shadow: 0 10px 30px rgba(12,36,18,0.04);
  font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
  color: #0b2a1a;
}
.create-cert h2 { margin: 0 0 8px; font-size:20px; }
.create-cert p.lead { margin: 0 0 14px; color: #546e63; font-size:13px; }

.gc-form { display: grid; gap: 12px; }
.gc-row { display: flex; gap: 12px; }
.gc-col { flex: 1; min-width: 0; display:flex; flex-direction:column; gap:6px; }
label.gc-label { font-size:13px; color:#32513f; font-weight:600; }
input.gc-input, textarea.gc-textarea, select.gc-select {
  padding: 10px 12px; border-radius:8px; border: 1px solid #e6efe6; background: #fff; font-size: 14px;
  outline: none;
}
input.gc-input:focus, textarea.gc-textarea:focus, select.gc-select:focus { box-shadow: 0 6px 18px rgba(13,86,44,0.06); border-color:#bfeec2; }

.small-muted { font-size:12px; color:#6f8378; }
.field-error { color:#c53030; font-size:13px; margin-top:6px; }

.controls { display:flex; gap:10px; margin-top:6px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid #dbeee0; background:#fff; cursor:pointer; font-weight:700; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.btn.primary { background: linear-gradient(180deg,#1db954,#0ea158); color:#fff; border:none; box-shadow: 0 8px 20px rgba(29,185,84,0.12); }
.btn.ghost { background:transparent; border:1px solid #e6efe6; color: #1b4b34; }

.preview {
  margin-top: 12px;
  display:flex;
  gap:12px;
  align-items:flex-start;
}
.preview img { width:160px; height:auto; border-radius:8px; border:1px solid #eee; }
.preview .meta { font-size:13px; color:#405b52; }

.result {
  margin-top: 18px;
  padding: 14px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid rgba(12,36,18,0.03);
  box-shadow: 0 8px 22px rgba(12,36,18,0.03);
}

.toast {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: rgba(11,42,18,0.96);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 720px) {
  .gc-row { flex-direction: column; }
  .preview img { width:120px; }
}

/* Layout: container to place AdminSidebar + main content */
.admin-page {
  display: flex;
  min-height: 100vh;
  background: #f4f7f5;
}
.admin-main {
  flex: 1;
  padding: 28px;
  box-sizing: border-box;
  max-width: 1200px;
  margin: 0 auto;
}
`;

/* minimal url validator */
function isValidUrl(s?: string) {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CreateCertificate(): React.ReactElement {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // validations
  const issues = useMemo(() => {
    const list: string[] = [];
    if (!recipient.trim()) list.push("Recipient is required.");
    if (pdfUrl && !isValidUrl(pdfUrl)) list.push("PDF URL is not a valid URL.");
    if (imageUrl && !isValidUrl(imageUrl)) list.push("Image URL is not a valid URL.");
    if (validUntil && new Date(validUntil) < new Date(issuedAt)) list.push("Valid until must be the same or after Issued at.");
    return list;
  }, [recipient, pdfUrl, imageUrl, issuedAt, validUntil]);

  // helper toast
  const showToast = (t: string, ttl = 2600) => {
    setToast(t);
    setTimeout(() => setToast(null), ttl);
  };

  // Optional file upload helper - attempts to upload to /uploads (relative to axios baseURL)
  async function uploadFileToServer(file: File) {
    const form = new FormData();
    form.append("file", file);
    try {
      // note: api.baseURL already contains /api, so call /uploads (not /api/uploads)
      const res = await api.post("/uploads", form, { headers: { "Content-Type": "multipart/form-data" } } as any);
      // try common response shapes
      const url = res?.data?.url ?? res?.data?.location ?? res?.data?.fileUrl ?? res?.data?.data?.url;
      return url ?? null;
    } catch (err: any) {
      console.warn("Upload failed (server may not provide /uploads):", err?.message ?? err);
      return null;
    }
  }

  // handle file selection + attempt upload (non-blocking)
  async function handleImageFileChange(f?: File | null) {
    if (!f) { setImageFile(null); return; }
    setImageFile(f);
    setImageUrl(""); // clear explicit url to avoid conflict
    setUploading(true);
    const uploaded = await uploadFileToServer(f);
    if (uploaded) {
      setImageUrl(uploaded);
      showToast("Image uploaded");
    } else {
      showToast("Image selected (not uploaded). You may upload manually or provide a URL.", 3500);
    }
    setUploading(false);
  }

  async function handlePdfFileChange(f?: File | null) {
    if (!f) { setPdfFile(null); return; }
    setPdfFile(f);
    setPdfUrl("");
    setUploading(true);
    const uploaded = await uploadFileToServer(f);
    if (uploaded) {
      setPdfUrl(uploaded);
      showToast("PDF uploaded");
    } else {
      showToast("PDF selected (not uploaded). You may upload manually or provide a URL.", 3500);
    }
    setUploading(false);
  }

  const clearForm = () => {
    setTitle("");
    setRecipient("");
    setIssuedAt(new Date().toISOString().slice(0, 10));
    setValidUntil("");
    setNotes("");
    setPdfUrl("");
    setImageUrl("");
    setImageFile(null);
    setPdfFile(null);
    setResult(null);
    setError(null);
  };

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setResult(null);
    if (issues.length) {
      setError(issues.join(" "));
      return;
    }
    setLoading(true);

    try {
      // If files present but not uploaded, attempt to upload (best-effort)
      if (imageFile && !imageUrl) {
        setUploading(true);
        const up = await uploadFileToServer(imageFile);
        if (up) setImageUrl(up);
        setUploading(false);
      }
      if (pdfFile && !pdfUrl) {
        setUploading(true);
        const up = await uploadFileToServer(pdfFile);
        if (up) setPdfUrl(up);
        setUploading(false);
      }

      const payload: any = {
        title: title || "Certificate",
        recipient: recipient.trim(),
        issuedAt: issuedAt ? new Date(issuedAt).toISOString() : new Date().toISOString(),
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        notes: notes || undefined,
      };
      if (pdfUrl) payload.pdfUrl = pdfUrl;
      if (imageUrl) payload.imageUrl = imageUrl;

      // IMPORTANT: api.baseURL already contains /api, so call "/certificates" (not "/api/certificates")
      const res = await api.post("/certificates", payload);
      const cert = res?.data?.certificate ?? res?.data ?? null;
      if (!cert) throw new Error("Unexpected server response");
      setResult(cert);
      showToast("Certificate issued");
    } catch (err: any) {
      console.error("create error", err);
      setError(err?.response?.data?.message || err?.message || "Failed to create certificate");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const copyLink = async () => {
    const url = result?.verifyUrl;
    if (!url) return showToast("No verification link available", 2400);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Verification link copied");
    } catch {
      showToast("Copy failed; please copy manually", 2600);
    }
  };

  const openCertificate = () => {
    if (!result) return;
    if (result.verifyUrl) window.open(result.verifyUrl, "_blank", "noopener");
    else if (result._id) navigate(`/certificates/${result._id}`);
  };

  const imagePreview = useMemo(() => {
    if (imageFile) return URL.createObjectURL(imageFile);
    if (imageUrl && isValidUrl(imageUrl)) return imageUrl;
    return null;
  }, [imageFile, imageUrl]);

  const pdfPreviewName = useMemo(() => {
    try {
      return pdfFile?.name ?? (pdfUrl ? new URL(pdfUrl).pathname.split("/").pop() : null);
    } catch {
      return pdfFile?.name ?? null;
    }
  }, [pdfFile, pdfUrl]);

  const canSubmit = !loading && !uploading && recipient.trim().length > 0 && issues.length === 0;

  return (
    <div className="admin-page">
      <style>{css}</style>
      <AdminSidebar />

      <main className="admin-main" role="main">
        <div className="create-cert" role="region" aria-labelledby="create-cert-title">
          <h2 id="create-cert-title">Create Certificate</h2>
          <p className="lead small-muted">Issue a verification certificate. You can provide PDF/image URLs or attach files (attempts to upload to /uploads if available).</p>

          <form className="gc-form" onSubmit={submit} noValidate>
            <div className="gc-row">
              <div className="gc-col">
                <label className="gc-label">Title</label>
                <input className="gc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Certificate title (optional)" aria-label="Title" />
                <div className="small-muted">Optional. If left empty a default title will be used.</div>
              </div>

              <div className="gc-col">
                <label className="gc-label">Recipient (required)</label>
                <input className="gc-input" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Recipient name" required aria-required="true" aria-label="Recipient" />
                <div className="small-muted">Who is the certificate issued to (name or organization).</div>
              </div>
            </div>

            <div className="gc-row">
              <div className="gc-col">
                <label className="gc-label">Issued at</label>
                <input className="gc-input" type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} aria-label="Issued at" />
              </div>
              <div className="gc-col">
                <label className="gc-label">Valid until</label>
                <input className="gc-input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} aria-label="Valid until" />
              </div>
            </div>

            <div>
              <label className="gc-label">Notes (optional)</label>
              <textarea className="gc-textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Short note or description" aria-label="Notes" />
            </div>

            <div className="gc-row">
              <div className="gc-col">
                <label className="gc-label">Image URL (optional)</label>
                <input className="gc-input" value={imageUrl} onChange={(e) => { setImageUrl(e.target.value); setImageFile(null); }} placeholder="https://cdn.example.com/cert.png" aria-label="Image URL" />
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <input id="imageFile" type="file" accept="image/*" onChange={(e) => handleImageFileChange(e.target.files?.[0] ?? null)} />
                  <button type="button" className="btn ghost" onClick={() => { setImageUrl(""); setImageFile(null); }}>Clear</button>
                  {uploading && <div className="small-muted">Uploading…</div>}
                </div>
                {imagePreview && (
                  <div className="preview" aria-hidden>
                    <img src={imagePreview} alt="Certificate preview" />
                    <div className="meta">
                      <div style={{ fontWeight: 700 }}>{title || "Certificate"}</div>
                      <div className="small-muted">{recipient}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="gc-col">
                <label className="gc-label">PDF URL (optional)</label>
                <input className="gc-input" value={pdfUrl} onChange={(e) => { setPdfUrl(e.target.value); setPdfFile(null); }} placeholder="https://cdn.example.com/cert.pdf" aria-label="PDF URL" />
                <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
                  <input id="pdfFile" type="file" accept="application/pdf" onChange={(e) => handlePdfFileChange(e.target.files?.[0] ?? null)} />
                  <button type="button" className="btn ghost" onClick={() => { setPdfUrl(""); setPdfFile(null); }}>Clear</button>
                </div>
                {pdfPreviewName && <div className="preview"><div className="meta"><div style={{ fontWeight: 700 }}>{pdfPreviewName}</div><div className="small-muted">PDF attached</div></div></div>}
              </div>
            </div>

            {issues.length > 0 && (
              <div role="alert" className="field-error">{issues.join(" ")}</div>
            )}
            {error && <div role="alert" className="field-error">{error}</div>}

            <div className="controls">
              <button type="submit" className="btn primary" disabled={!canSubmit}>
                {loading ? "Issuing…" : "Issue certificate"}
              </button>
              <button type="button" className="btn" onClick={clearForm} disabled={loading || uploading}>Clear</button>
              <button type="button" className="btn" onClick={() => { setResult(null); setError(null); }}>Reset result</button>
            </div>
          </form>

          {result && (
            <div className="result" role="status" aria-live="polite">
              <h3 style={{ marginTop: 0 }}>Certificate issued</h3>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ minWidth: 240 }}>
                  <div><strong>ID:</strong> {result._id}</div>
                  {result.verifyUrl && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Verify URL:</strong>{" "}
                      <a href={result.verifyUrl} target="_blank" rel="noopener noreferrer">{result.verifyUrl}</a>
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <button className="btn" onClick={copyLink}>Copy link</button>{" "}
                    <button className="btn" onClick={openCertificate}>Open</button>
                    {result.pdfUrl && <a href={result.pdfUrl} target="_blank" rel="noopener noreferrer"><button className="btn">Open PDF</button></a>}
                  </div>
                </div>

                {result.verifyUrl && (
                  <div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(result.verifyUrl)}`}
                      alt="QR"
                      width={160}
                      height={160}
                      style={{ border: "1px solid #eee", borderRadius: 8 }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {toast && <div className="toast" role="status">{toast}</div>}
        </div>
      </main>
    </div>
  );
}