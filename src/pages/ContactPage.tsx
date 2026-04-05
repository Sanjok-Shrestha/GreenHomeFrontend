import React, { useState } from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const css = `
.support-page { min-height:100vh; display:flex; flex-direction:column; font-family:'DM Sans', system-ui, sans-serif; background:#fff; color:#0f2a1b; }
.support-main { max-width:720px; margin:36px auto; padding:0 20px; }
.support-card { background:#fff; border-radius:12px; padding:24px; box-shadow:0 6px 18px rgba(17,28,20,0.03); border:1px solid rgba(17,28,20,0.03); }
.support-card h1 { margin:0 0 8px; font-family:'Fraunces', Georgia, serif; color:#1f7a44; font-size:1.4rem; }
.form-row { display:flex; gap:12px; margin-bottom:12px; }
.form-field { flex:1; display:flex; flex-direction:column; }
label { font-size:0.82rem; font-weight:700; color:#4d6451; margin-bottom:6px; }
input, textarea { padding:10px 12px; border-radius:8px; border:1px solid rgba(17,28,20,0.08); font-size:0.95rem; font-family:inherit; resize:vertical; }
textarea { min-height:120px; }
.btn { display:inline-flex; align-items:center; gap:8px; padding:10px 16px; border-radius:10px; background:#2d8c4e; color:#fff; font-weight:800; border:none; cursor:pointer; }
.btn[disabled] { opacity:0.6; cursor:not-allowed; }
.success { margin-top:12px; color:#1f7a44; font-weight:700; }
.error { color:#b00020; font-weight:700; font-size:0.9rem; margin-top:8px; }
.back-link { display:inline-block; margin-top:14px; color:#2d8c4e; font-weight:700; text-decoration:none; }
@media (max-width:640px) { .form-row { flex-direction:column } .support-main { padding:0 12px } }
`;

const ContactSupportPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function validate() {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
    if (!message.trim()) return "Please enter a message.";
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    // simulate API call
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSuccess("Thanks — your message has been sent. We'll reply to your email shortly.");
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <div className="support-page">
      <style>{css}</style>
      <NavBar />
      <main className="support-main" role="main">
        <div className="support-card" aria-labelledby="support-heading">
          <h1 id="support-heading">Contact support</h1>
          <p style={{ color: "#4d6451", marginTop: 8 }}>
            Need help with a pickup, account, or collector verification? Send us a message below.
          </p>

          <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
            <div className="form-row">
              <div className="form-field">
                <label htmlFor="name">Your name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label htmlFor="message">Message</label>
              <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>

            {error && <div className="error" role="alert">{error}</div>}
            {success && <div className="success" role="status">{success}</div>}

            <div style={{ marginTop: 12 }}>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>

          <Link to="/help" className="back-link">← Back to Help &amp; Resources</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactSupportPage;