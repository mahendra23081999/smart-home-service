"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="sec"><div className="container" style={{ textAlign: "center", maxWidth: 560 }}>
      <h1>Something went wrong</h1><p className="muted">Please try again. If it keeps happening, contact us on WhatsApp.</p>
      <button className="btn btn-primary" onClick={reset}>Try again</button>
    </div>
  </section>);
}
