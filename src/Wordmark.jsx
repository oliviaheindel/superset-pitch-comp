/* The name, with its dot picked out. */
export default function Wordmark({ className = '' }) {
  return <span className={`wm ${className}`} aria-label="sell.yoursellf">sell<span className="wm-dot">.</span>yoursellf</span>;
}
