import Link from "next/link";

export default function NotFound() {
  return <>
    <section className="phead"><div className="container"><h1>Page not found</h1><p>The page you were looking for doesn&apos;t exist.</p></div></section>
    <section className="sec"><div className="container" style={{ textAlign: "center" }}><Link className="btn btn-primary" href="/">Go home</Link></div></section>
  </>;
}
