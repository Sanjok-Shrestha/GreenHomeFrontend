/* ============================================================
   Tip carousel + FAQ (unchanged)
   ============================================================ */
import {
  useEffect,
 
  useRef,
  useState,
 
} from "react";

   const TIP_LIST = [
  { id: "t1", emoji: "🧼", title: "Rinse & Dry", text: "Rinse containers and allow to air-dry — clean items fetch better prices and are easier to handle." },
  { id: "t2", emoji: "📦", title: "Bundle Cardboard", text: "Flatten and tie cardboard — bundles save time for collectors and reduce transport space." },
  { id: "t3", emoji: "📸", title: "Photo Tips", text: "Use plain backgrounds and natural light. Include a common object for scale (e.g., a bottle)." },
  { id: "t4", emoji: "🏷️", title: "Label Mixed Loads", text: "If materials are mixed, label them clearly (PET, HDPE, mixed plastics) to avoid rejection." },
];

export function TipCarousel() {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % TIP_LIST.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translateX(-${index * (320 + 12)}px)`;
  }, [index]);

  return (
    <div className="tips-wrap">
      <div className="carousel" role="region" aria-label="Quick recycling tips">
        <div className="carousel__header">
          <div className="carousel__heading">Quick Tips</div>
          <div className="carousel__subheading">Short, actionable tips to get better pickups</div>
        </div>

        <div className="carousel__body">
          <div className="carousel-controls" aria-hidden>
            <button className="ctrl" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label="Previous tip">◀</button>
            <button className="ctrl" onClick={() => setIndex((i) => (i + 1) % TIP_LIST.length)} aria-label="Next tip">▶</button>
          </div>

          <div className="carousel__overflow">
            <div className="tip-track" ref={trackRef} role="list" aria-live="polite">
              {TIP_LIST.map((t) => (
                <div key={t.id} className="tip-card" role="listitem">
                  <div className="tip-emoji" aria-hidden>{t.emoji}</div>
                  <div className="tip-body">
                    <div className="tip-title">{t.title}</div>
                    <div className="tip-desc">{t.text}</div>
                    <div className="tip-actions">
                      <button className="tip-btn-learn" onClick={() => alert(`${t.title}: ${t.text}`)}>Learn more</button>
                      <button className="tip-btn-copy" onClick={() => navigator.clipboard?.writeText(t.text).then(() => alert("Copied tip"))}>Copy tip</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="dots" role="tablist" aria-label="Tip pages">
            {TIP_LIST.map((_, i) => (
              <div
                key={i}
                className={`dot${i === index ? " active" : ""}`}
                onClick={() => setIndex(i)}
                role="tab"
                aria-selected={i === index}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FAQ_ITEMS = [
  { q: "Can I post without an account?", a: "No — posting requires an account so collectors can coordinate pickups. Create one in minutes." },
  { q: "How are collectors verified?", a: "Collectors submit identity and business documents which admins review; verified collectors receive a badge." },
  { q: "Is pickup always free?", a: "Many pickups are free, but some items or long-distance pickups may incur fees (shown during booking)." },
  { q: "What if my posted item is rejected?", a: "Collectors can mark posts unavailable; you'll be notified and can relist with clearer photos or info." },
];

export function FAQAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => { setOpen(0); }, []);

  function toggle(i: number) {
    setOpen((cur) => (cur === i ? null : i));
    setTimeout(
      () => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      260
    );
  }

  return (
    <div className="accordion" role="list" aria-label="Frequently asked questions">
      {FAQ_ITEMS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="ac-item" role="listitem">
            <div
              className="ac-question"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={`ans-${i}`}
            >
              <div className="ac-q-text">{f.q}</div>
              <div
                className="ac-toggle"
                style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                {isOpen ? "−" : "+"}
              </div>
            </div>
            <div
              id={`ans-${i}`}
              className={`ac-answer${isOpen ? " open" : ""}`}
              style={{ maxHeight: isOpen ? "240px" : "0px" }}
              ref={(el) => { refs.current[i] = el; }}
              role="region"
              aria-hidden={!isOpen}
            >
              {f.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}