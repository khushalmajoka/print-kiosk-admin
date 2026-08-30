import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import "./ShopQRCode.css";

const CUSTOMER_BASE_URL = "https://printkaro-customer.vercel.app";

export default function ShopQRCode({ shopId, shopName }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const customerUrl = `${CUSTOMER_BASE_URL}/?shop=${shopId}`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3, // high-res, print-quality
        backgroundColor: "#F7F3EA",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `PrintKaro-QR-${shopId}.png`;
      link.click();
    } catch (err) {
      console.error("QR card export failed", err);
      alert("Download fail ho gaya, dobara try karo.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* ---- Simple version: dashboard pe yahi dikhta hai ---- */}
      <div className="qr-simple">
        <div className="qr-simple-canvas">
          <QRCodeCanvas value={customerUrl} size={110} level="H" includeMargin={false} />
        </div>
        <div className="qr-simple-info">
          <p className="qr-simple-label">Customer link</p>
          <code className="qr-simple-url">{customerUrl}</code>
          <button className="secondary-btn small" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Preparing..." : "⬇ Download Printable QR"}
          </button>
        </div>
      </div>

      {/* ---- Fancy version: sirf download/PNG ke liye, screen pe kabhi nahi dikhta ---- */}
      <div className="qr-offscreen">
        <div className="qr-card" ref={cardRef}>
          <div className="qr-card-header">
            <span className="qr-card-brand">PrintKaro</span>
            <span className="qr-card-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <rect x="4" y="9" width="16" height="7" rx="1" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 9V4h10v5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M7 16v4h10v-4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
          </div>

          <div className="qr-card-body">
            <p className="qr-card-eyebrow">at this counter</p>
            <h2 className="qr-card-shopname">{shopName}</h2>

            <div className="qr-frame">
              <div className="qr-frame-inner">
                <QRCodeCanvas value={customerUrl} size={190} level="H" includeMargin={false} />
              </div>
            </div>

            <p className="qr-card-tagline">Scan Karo, Print Karo</p>
          </div>

          <div className="qr-card-perforation" aria-hidden="true" />

          <div className="qr-card-footer">
            <p className="qr-card-steps">
              <span>SCAN</span>
              <span className="arrow">→</span>
              <span>UPLOAD</span>
              <span className="arrow">→</span>
              <span>PRINT</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}