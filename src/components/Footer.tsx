import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="fo-footer" aria-label="Site footer">
      <div className="fo-top">
        <div className="fo-left">
          <div className="fo-brand">
            {/* Replace with your logo image if you have one */}
            <div className="fo-logo">GreenHome</div>
            <div className="fo-tag">Neighborhood recycling made simple</div>
          </div>

          <div className="fo-cta">
            <Link to="/collector/apply" className="fo-cta-btn">Become a collector</Link>
          </div>

          <div className="fo-social" aria-hidden>
            {/* Instagram only (Facebook and YouTube removed as requested) */}
            <a
              className="fo-social-btn"
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              title="Instagram"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17.5 6.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="fo-columns">
          <div className="fo-col">
            <div className="fo-heading">Explore</div>
            <ul className="fo-list">
              <li><Link to="/explore" className="fo-link">Browse posts</Link></li>
              <li><Link to="/map" className="fo-link">Pickup map</Link></li>
              <li><Link to="/how-it-works" className="fo-link">How it works</Link></li>
            </ul>
          </div>

          <div className="fo-col">
            <div className="fo-heading">Services</div>
            <ul className="fo-list">
              <li><Link to="/post-waste" className="fo-link">Request pickup</Link></li>
              <li><Link to="/services/business" className="fo-link">Business collections</Link></li>
              <li><Link to="/rewards" className="fo-link">Rewards & perks</Link></li>
            </ul>
          </div>

          <div className="fo-col">
            <div className="fo-heading">Help & Resources</div>
            <ul className="fo-list">
              <li><Link to="/faq" className="fo-link">FAQ</Link></li>
              <li><Link to="/tips" className="fo-link">Recycling tips</Link></li>
              <li><Link to="/contact" className="fo-link">Contact support</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="fo-bottom">
        <div className="fo-bottom-inner">
          <div className="fo-copy">© {new Date().getFullYear()} GreenHome Nepal — All rights reserved</div>
          <div className="fo-legal">
            <Link to="/privacy" className="fo-legal-link">Privacy</Link>
            <span className="fo-sep">•</span>
            <Link to="/terms" className="fo-legal-link">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}