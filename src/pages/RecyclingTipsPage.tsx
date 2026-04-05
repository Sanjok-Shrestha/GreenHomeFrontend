import React from "react";
import { Link } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

const css = `
.recycle-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #0f2a1b;
  font-family: 'DM Sans', system-ui, sans-serif;
}

/* Page container */
.recycle-main {
  max-width: 1040px;
  margin: 36px auto;
  width: 100%;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 28px;
  align-items: start;
}

/* Left navigation panel (matches Help page) */
.recycle-panel {
  background: #eef9ee;
  border-radius: 14px;
  padding: 24px 18px;
  box-shadow: 0 8px 24px rgba(17,28,20,0.04);
  border: 1px solid rgba(45,140,78,0.06);
  position: sticky;
  top: 24px;
  height: fit-content;
}

.recycle-panel h2 {
  margin: 0 0 12px;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.5rem;
  color: #1f7a44;
  font-weight: 900;
}

.recycle-links {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recycle-links a {
  color: #114f2d;
  text-decoration: none;
  font-size: 1.02rem;
  font-weight: 700;
  padding: 6px 4px;
  border-radius: 8px;
  display: inline-block;
  transition: background 160ms ease, transform 160ms ease;
}

.recycle-links a:hover,
.recycle-links a:focus {
  background: rgba(45,140,78,0.06);
  transform: translateX(4px);
  outline: none;
}

/* Right content */
.recycle-content { padding: 6px 4px; }

.tip-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 18px rgba(17,28,20,0.03);
  margin-bottom: 18px;
  border: 1px solid rgba(17,28,20,0.03);
}

.tip-section h3 {
  margin: 0 0 8px;
  color: #123b27;
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 800;
}

.tip-section p {
  margin: 0 0 10px;
  color: #4d6451;
  line-height: 1.6;
}

/* Tip lists */
.tip-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 8px;
}

.tip-card {
  background: #f7faf4;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid rgba(45,140,78,0.04);
  color: #233829;
}

.tip-card h4 {
  margin: 0 0 6px;
  font-size: 0.98rem;
  font-weight: 800;
  color: #1f7a44;
}

.tip-card p {
  margin: 0;
  font-size: 0.93rem;
  color: #3f5343;
  line-height: 1.5;
}

/* Inline small utilities */
.small-note {
  font-size: 0.9rem;
  color: #5a6e52;
  margin-top: 8px;
}

/* Back link */
.back-link {
  display: inline-block;
  margin-top: 12px;
  color: #2d8c4e;
  font-weight: 700;
  text-decoration: none;
}

/* Responsive */
@media (max-width: 900px) {
  .recycle-main { grid-template-columns: 1fr; gap: 18px; }
  .tip-list { grid-template-columns: 1fr; }
  .recycle-panel { position: relative; top: 0; }
}
`;

const RecyclingTipsPage: React.FC = () => {
  return (
    <div className="recycle-page">
      <style>{css}</style>
      <NavBar />

      <main className="recycle-main" role="main">
        <aside className="recycle-panel" aria-labelledby="recycle-heading">
          <h2 id="recycle-heading">Recycling tips</h2>

          <ul className="recycle-links" role="navigation" aria-label="Recycling sections">
            <li><a href="#plastics">Plastics</a></li>
            <li><a href="#paper">Paper &amp; Cardboard</a></li>
            <li><a href="#metal">Metal</a></li>
            <li><a href="#glass">Glass</a></li>
            <li><a href="#electronics">Electronics</a></li>
            <li><a href="#clothing">Clothing &amp; Textiles</a></li>
            <li><a href="#compost">Composting</a></li>
          </ul>

          <div style={{ marginTop: 16 }}>
            <Link to="/help" className="back-link">← Back to Help &amp; Resources</Link>
          </div>
        </aside>

        <section className="recycle-content" aria-live="polite">
          <article id="plastics" className="tip-section" tabIndex={-1} aria-labelledby="plastics-title">
            <h3 id="plastics-title">Plastics</h3>
            <p>Plastics are commonly accepted but require a little prep to be recyclable. Follow these quick rules:</p>

            <div className="tip-list" role="list">
              <div className="tip-card" role="listitem">
                <h4>Rinse &amp; Dry</h4>
                <p>Rinse containers to remove food residue. Dry them briefly — wet materials can contaminate recycling loads.</p>
              </div>

              <div className="tip-card" role="listitem">
                <h4>Remove caps when required</h4>
                <p>Some programs want caps removed (check local rules). If left on, screw caps should be small and placed in the container if allowed.</p>
              </div>

              <div className="tip-card" role="listitem">
                <h4>Flatten bulky items</h4>
                <p>Flatten large rigid plastics when possible to save bin space and make handling easier.</p>
              </div>

              <div className="tip-card" role="listitem">
                <h4>Know your resin codes</h4>
                <p>Codes (1–7) indicate plastic types; most collection programs take PET (1) and HDPE (2) — check locally for others.</p>
              </div>
            </div>

            <p className="small-note">Tip: When in doubt, check your municipality's guidelines or the Explore page for local recycling centers.</p>
          </article>

          <article id="paper" className="tip-section" tabIndex={-1} aria-labelledby="paper-title">
            <h3 id="paper-title">Paper &amp; Cardboard</h3>
            <p>Paper recycling is high-value but easily contaminated. Keep it clean and dry:</p>

            <div className="tip-list">
              <div className="tip-card">
                <h4>Flatten cardboard</h4>
                <p>Break down boxes and flatten them to save space and improve collection efficiency.</p>
              </div>

              <div className="tip-card">
                <h4>Remove food-soiled sections</h4>
                <p>Pizza boxes with grease often aren’t recyclable — tear off clean portions or compost greasy parts where available.</p>
              </div>

              <div className="tip-card">
                <h4>No shredded paper loose</h4>
                <p>Contain shredded paper in a paper bag (if accepted) — loose shreds can jam sorting machinery.</p>
              </div>

              <div className="tip-card">
                <h4>Mixed-paper guidelines</h4>
                <p>Magazines, junk mail, office paper are usually fine; laminated or heavily coated paper may not be accepted.</p>
              </div>
            </div>
          </article>

          <article id="metal" className="tip-section" tabIndex={-1} aria-labelledby="metal-title">
            <h3 id="metal-title">Metal</h3>
            <p>Metal recycling (cans, tins, foil) is straightforward and valuable:</p>

            <div className="tip-list">
              <div className="tip-card">
                <h4>Empty &amp; rinse</h4>
                <p>Ensure cans are empty and rinsed. Labels can remain; remove large plastic parts.</p>
              </div>

              <div className="tip-card">
                <h4>Crush if space is tight</h4>
                <p>Crushing cans saves space but avoid crushing hazardous containers or aerosols.</p>
              </div>

              <div className="tip-card">
                <h4>Separate scrap metal</h4>
                <p>Large scrap (appliances, frames) may need special drop-off — use local scrap yards or collection events.</p>
              </div>

              <div className="tip-card">
                <h4>Aerosol/can warnings</h4>
                <p>Empty aerosols may be recyclable in some programs — follow local guidance and don't puncture pressurized cans.</p>
              </div>
            </div>
          </article>

          <article id="glass" className="tip-section" tabIndex={-1} aria-labelledby="glass-title">
            <h3 id="glass-title">Glass</h3>
            <p>Glass bottles and jars are widely recyclable but require care:</p>

            <div className="tip-list">
              <div className="tip-card">
                <h4>Rinse &amp; remove lids</h4>
                <p>Rinse bottles and jars. Remove lids and recycle them separately if accepted.</p>
              </div>

              <div className="tip-card">
                <h4>Do not mix types</h4>
                <p>Some programs separate by color (clear, brown, green) — check local rules.</p>
              </div>

              <div className="tip-card">
                <h4>Broken glass</h4>
                <p>Wrap broken glass and follow your local service rules — many systems don't accept shattered glass in curbside bins.</p>
              </div>

              <div className="tip-card">
                <h4>Ceramics &amp; mirrors</h4>
                <p>These are NOT typically recyclable with bottles — dispose of them separately.</p>
              </div>
            </div>
          </article>

          <article id="electronics" className="tip-section" tabIndex={-1} aria-labelledby="electronics-title">
            <h3 id="electronics-title">Electronics</h3>
            <p>Electronics require special handling — never put them in regular recycling:</p>

            <div className="tip-list">
              <div className="tip-card">
                <h4>Use e-waste drop-offs</h4>
                <p>Find certified e-waste recycling or municipal hazardous waste events for phones, batteries, and appliances.</p>
              </div>

              <div className="tip-card">
                <h4>Remove personal data</h4>
                <p>Wipe or remove storage (where possible) before recycling devices; consider donating working devices first.</p>
              </div>

              <div className="tip-card">
                <h4>Batteries</h4>
                <p>Keep batteries separate and bring them to battery recycling points — they are hazardous if mixed with waste streams.</p>
              </div>

              <div className="tip-card">
                <h4>Printer cartridges &amp; cords</h4>
                <p>Many retailers accept cartridges and cords for recycling — check local drop-off programs.</p>
              </div>
            </div>
          </article>

          <article id="clothing" className="tip-section" tabIndex={-1} aria-labelledby="clothing-title">
            <h3 id="clothing-title">Clothing &amp; Textiles</h3>
            <p>Donate wearable items and recycle textiles that are damaged or stained via textile programs:</p>

            <div className="tip-list">
              <div className="tip-card">
                <h4>Donate usable items</h4>
                <p>Good-condition clothing should be donated to local charities or clothing banks.</p>
              </div>

              <div className="tip-card">
                <h4>Repurpose or recycle damaged textiles</h4>
                <p>Torn or stained fabrics can be turned into rags or taken to textile recycling points.</p>
              </div>

              <div className="tip-card">
                <h4>Remove non-fabric parts</h4>
                <p>Take out zippers or large buttons where possible; separate mixed-material items when required.</p>
              </div>

              <div className="tip-card">
                <h4>Footwear</h4>
                <p>Many programs accept shoes for reuse or recycling — check local collection partners.</p>
              </div>
            </div>
          </article>

          <article id="compost" className="tip-section" tabIndex={-1} aria-labelledby="compost-title">
            <h3 id="compost-title">Composting</h3>
            <p>Composting keeps organics out of the landfill and creates useful soil — here are basic rules:</p>

            <div className="tip-list">
              <div className="tip-card">
                <h4>What to compost</h4>
                <p>Fruit &amp; vegetable scraps, coffee grounds, eggshells, and yard waste are great for composting.</p>
              </div>

              <div className="tip-card">
                <h4>What not to compost</h4>
                <p>Avoid meat, dairy, and oily foods in small/municipal composting systems (these attract pests).</p>
              </div>

              <div className="tip-card">
                <h4>Compost bins</h4>
                <p>Use a home composter or local green-waste collection service. Keep a balance of greens and browns.</p>
              </div>

              <div className="tip-card">
                <h4>Community programs</h4>
                <p>Many areas have community compost drop-offs — check the Explore page or your municipality site.</p>
              </div>
            </div>
          </article>

          <div style={{ marginTop: 8, marginBottom: 28 }}>
            <p style={{ color: "#5a6e52", margin: 0 }}>
              For local acceptance rules, search the Explore page or contact your municipality. If you need help, visit the Contact support page.
            </p>
            <Link to="/support" className="back-link">Contact support →</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RecyclingTipsPage;