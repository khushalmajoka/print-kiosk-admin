import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

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
            <div className="qr-hint">
              Customer link: <code>printkaro-customer.vercel.app/?shop={shop.shopId}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
