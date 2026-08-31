import React, { useState, useEffect, useCallback } from "react";
import "./App.css";
import "./AgentKeyModal.css";
import ShopQRCode from "./components/ShopQRCode";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://print-kiosk-backend-t470.onrender.com";

function App() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem("printkaro_admin_key"));
  const [keyInput, setKeyInput] = useState("");
  const [authError, setAuthError] = useState(null);

  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Register form fields
  const [shopName, setShopName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [city, setCity] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  // Agent key generation
  const [generatingKey, setGeneratingKey] = useState(null); // shopId currently generating
  const [agentKeyModal, setAgentKeyModal] = useState(null); // { shopId, shopName, key } | null
  const [agentKeyCopied, setAgentKeyCopied] = useState(false);

  const fetchShops = useCallback(async (key) => {
    try {
      const res = await fetch(`${BACKEND_URL}/shops`, {
        headers: { "x-admin-key": key },
      });
      if (res.status === 401) {
        setAuthError("Invalid admin key.");
        sessionStorage.removeItem("printkaro_admin_key");
        setAdminKey(null);
        return;
      }
      const data = await res.json();
      setShops(data);
    } catch (e) {
      console.error("Failed to fetch shops", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminKey) {
      setLoading(false);
      return;
    }
    fetchShops(adminKey);
    const interval = setInterval(() => fetchShops(adminKey), 8000);
    return () => clearInterval(interval);
  }, [adminKey, fetchShops]);

  function handleLogin(e) {
    e.preventDefault();
    setAuthError(null);
    sessionStorage.setItem("printkaro_admin_key", keyInput);
    setAdminKey(keyInput);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegisterError(null);
    setRegistering(true);

    try {
      const res = await fetch(`${BACKEND_URL}/shops/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ shopName, ownerPhone, city }),
      });

      if (!res.ok) throw new Error("Failed to register shop.");

      setShopName("");
      setOwnerPhone("");
      setCity("");
      setShowRegisterForm(false);
      await fetchShops(adminKey);
    } catch (e) {
      setRegisterError(e.message);
    } finally {
      setRegistering(false);
    }
  }

  function copyShopId(shopId) {
    navigator.clipboard.writeText(shopId);
    setCopiedId(shopId);
    setTimeout(() => setCopiedId(null), 1500);
  }

  async function handleGenerateAgentKey(shopId, shopNameForModal) {
    const confirmed = window.confirm(
      `Naya agent key generate karein "${shopNameForModal}" ke liye?\n\nPurani key (agar hai) turant kaam karna band kar degi — Local Agent ke config.json mein naya key update karna hoga.`
    );
    if (!confirmed) return;

    setGeneratingKey(shopId);
    try {
      const res = await fetch(`${BACKEND_URL}/shops/${shopId}/agent-key`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Agent key generate nahi ho payi.");
      const data = await res.json();
      setAgentKeyModal({ shopId, shopName: shopNameForModal, key: data.agentKey });
      setAgentKeyCopied(false);
    } catch (e) {
      alert(e.message);
    } finally {
      setGeneratingKey(null);
    }
  }

  function copyAgentKey() {
    if (!agentKeyModal) return;
    navigator.clipboard.writeText(agentKeyModal.key);
    setAgentKeyCopied(true);
  }

  // ---- Login screen ----
  if (!adminKey) {
    return (
      <div className="admin-page">
        <div className="login-card">
          <div className="brand">PrintKaro Admin</div>
          <h1>Owner Login</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Admin key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
            {authError && <p className="error-text">{authError}</p>}
            <button type="submit" className="primary-btn">Enter</button>
          </form>
        </div>
      </div>
    );
  }

  const totals = shops.reduce(
    (acc, s) => ({
      orders: acc.orders + s.stats.totalOrders,
      revenue: acc.revenue + s.stats.estimatedRevenue,
    }),
    { orders: 0, revenue: 0 }
  );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="brand">PrintKaro Admin</div>
        <button className="logout-btn" onClick={() => { sessionStorage.removeItem("printkaro_admin_key"); setAdminKey(null); }}>
          Log Out
        </button>
      </header>

      <div className="summary-row">
        <div className="summary-card">
          <span className="summary-value">{shops.length}</span>
          <span className="summary-label">Shops</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">{totals.orders}</span>
          <span className="summary-label">Total Orders</span>
        </div>
        <div className="summary-card">
          <span className="summary-value">₹{totals.revenue}</span>
          <span className="summary-label">Revenue (completed)</span>
        </div>
      </div>

      <div className="section-header">
        <h2>Shops</h2>
        <button className="primary-btn small" onClick={() => setShowRegisterForm((v) => !v)}>
          {showRegisterForm ? "Cancel" : "+ Register New Shop"}
        </button>
      </div>

      {showRegisterForm && (
        <form className="register-card" onSubmit={handleRegister}>
          <input placeholder="Shop name" value={shopName} onChange={(e) => setShopName(e.target.value)} required />
          <input placeholder="Owner phone" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
          {registerError && <p className="error-text">{registerError}</p>}
          <button type="submit" className="primary-btn" disabled={registering}>
            {registering ? "Registering..." : "Register Shop"}
          </button>
        </form>
      )}

      {loading && <p className="loading-text">Loading...</p>}

      <div className="shop-list">
        {!loading && shops.length === 0 && (
          <p className="empty-state">No shops registered yet.</p>
        )}
        {shops.map((shop) => (
          <div className="shop-card" key={shop.shopId}>
            <div className="shop-card-top">
              <div>
                <h3>{shop.shopName}</h3>
                <p className="shop-meta">{shop.city || "—"} · {shop.ownerPhone || "—"}</p>
              </div>
              <button className="copy-btn" onClick={() => copyShopId(shop.shopId)}>
                {copiedId === shop.shopId ? "Copied!" : shop.shopId}
              </button>
            </div>
            <div className="shop-stats">
              <div className="stat">
                <span className="stat-value">{shop.stats.totalOrders}</span>
                <span className="stat-label">Total Orders</span>
              </div>
              <div className="stat">
                <span className="stat-value">{shop.stats.completedOrders}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{shop.stats.awaitingApproval}</span>
                <span className="stat-label">Awaiting Approval</span>
              </div>
              <div className="stat">
                <span className="stat-value">₹{shop.stats.estimatedRevenue}</span>
                <span className="stat-label">Revenue</span>
              </div>
            </div>

            <ShopQRCode shopId={shop.shopId} shopName={shop.shopName} />

            <button
              className="secondary-btn small agent-key-trigger"
              onClick={() => handleGenerateAgentKey(shop.shopId, shop.shopName)}
              disabled={generatingKey === shop.shopId}
            >
              {generatingKey === shop.shopId ? "Generating..." : "🔑 Get Agent Key"}
            </button>
          </div>
        ))}
      </div>

      {agentKeyModal && (
        <div className="agent-key-backdrop" onClick={() => setAgentKeyModal(null)}>
          <div className="agent-key-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Agent Key — {agentKeyModal.shopName}</h3>
            <p className="agent-key-hint">
              Ye key sirf ek baar dikhegi. Shop ke Local Agent ke <code>config.json</code> mein{" "}
              <code>"agent_key"</code> field mein paste kar dena, fir agent restart karna.
            </p>
            <div className="agent-key-value">
              <code>{agentKeyModal.key}</code>
              <button className="copy-btn small" onClick={copyAgentKey}>
                {agentKeyCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button className="primary-btn small" onClick={() => setAgentKeyModal(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
