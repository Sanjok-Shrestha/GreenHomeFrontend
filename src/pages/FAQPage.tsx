import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const css = `
.faq-page { min-height:100vh; display:flex; flex-direction:column; font-family:'DM Sans', system-ui, sans-serif; background:#fff; color:#0f2a1b; }
.faq-main { max-width:1040px; margin:36px auto; padding:0 20px; }
.faq-hero { margin-bottom:18px; }
.faq-hero h1 { font-family:'Fraunces', Georgia, serif; color:#1f7a44; margin:0 0 8px; font-size:1.6rem; }
.faq-list { display:grid; gap:12px; }
.faq-item { background:#fff; border-radius:12px; padding:18px; box-shadow:0 6px 18px rgba(17,28,20,0.03); border:1px solid rgba(17,28,20,0.03); }
.faq-q { margin:0 0 6px; font-weight:800; color:#123b27; }
.faq-a { margin:0; color:#4d6451; line-height:1.6; }
.back-link { display:inline-block; margin-top:14px; color:#2d8c4e; font-weight:700; text-decoration:none; }
@media (max-width:560px) { .faq-main { padding:0 12px } }
`;

const FAQPage: React.FC = () => {
  const faqs = [
    { q: "How do I schedule a pickup?", a: "From Explore or your Dashboard, select 'Post Waste', choose type/quantity and request pickup. Collectors will be notified." },
    { q: "What items are accepted?", a: "Plastic bottles, paper & cardboard, metal cans, glass bottles. Check Recycling tips for prep rules and local exceptions." },
    { q: "How do I become a verified collector?", a: "Sign up as a collector and complete identity verification and pickup history checks. See Collector onboarding in the dashboard." },
    { q: "How are points & certificates awarded?", a: "Points are granted after confirmed pickup. Certificates are issued for milestones (e.g., 100 kg recycled)." },
  ];

  return (
    <div className="faq-page">
      <style>{css}</style>
      <NavBar />
      <main className="faq-main" role="main">
        <header className="faq-hero">
          <h1>FAQ</h1>
          <p style={{ color: "#4d6451", marginTop: 6 }}>Answers to common questions about posting items, pickups, and accounts.</p>
        </header>

        <section className="faq-list" aria-labelledby="faq-list-heading">
          {faqs.map((f, i) => (
            <div className="faq-item" key={i} tabIndex={0} aria-labelledby={`q-${i}`}>
              <div id={`q-${i}`} className="faq-q">{f.q}</div>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </section>

        <Link to="/help" className="back-link">← Back to Help &amp; Resources</Link>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;