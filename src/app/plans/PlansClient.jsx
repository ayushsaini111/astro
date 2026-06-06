// "use client";

// import { useState } from "react";

// function loadRazorpay() {
//   return new Promise((resolve) => {
//     if (window.Razorpay) return resolve(true);
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// }

// export default function PlansClient({ plans, status, userId }) {
//   const [buying, setBuying] = useState(null);
//   const [message, setMessage] = useState("");

//   async function handleBuy(plan) {
//     setBuying(plan.id);
//     setMessage("");

//     const loaded = await loadRazorpay();
//     if (!loaded) {
//       setMessage("❌ Failed to load payment gateway.");
//       setBuying(null);
//       return;
//     }

//     const orderRes = await fetch("/api/plans/create-order", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ planId: plan.id }),
//     });

//     let orderData;
//     try {
//       orderData = await orderRes.json();
//     } catch (e) {
//       setMessage("❌ Server error. Check terminal logs.");
//       setBuying(null);
//       return;
//     }

//     if (!orderRes.ok) {
//       setMessage(`❌ ${orderData.error}`);
//       setBuying(null);
//       return;
//     }

//     const options = {
//       key: orderData.keyId,
//       amount: orderData.amount,
//       currency: orderData.currency,
//       name: "Rantraa",
//       description: orderData.planName,
//       order_id: orderData.orderId,
//       handler: async function (response) {
//         const verifyRes = await fetch("/api/plans/verify-payment", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             razorpay_order_id: response.razorpay_order_id,
//             razorpay_payment_id: response.razorpay_payment_id,
//             razorpay_signature: response.razorpay_signature,
//             planId: plan.id,
//           }),
//         });
//         const verifyData = await verifyRes.json();
//         if (verifyRes.ok) {
//           setMessage("✅ Plan activated successfully!");
//           setTimeout(() => window.location.reload(), 1200);
//         } else {
//           setMessage(`❌ Payment verification failed: ${verifyData.error}`);
//         }
//         setBuying(null);
//       },
//       prefill: { contact: "", email: "" },
//       theme: { color: "#341539" },
//       modal: {
//         ondismiss: () => {
//           setMessage("⚠️ Payment cancelled.");
//           setBuying(null);
//         },
//       },
//     };

//     const rzp = new window.Razorpay(options);
//     rzp.open();
//   }

//   return (
//     <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
//       <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Talktime Plans</h1>

//       <div style={{
//         background: status?.hasFreeCall ? "#f0fdf4" : "#fef9f0",
//         border: `1px solid ${status?.hasFreeCall ? "#bbf7d0" : "#fed7aa"}`,
//         borderRadius: 12, padding: 16, marginBottom: 24,
//       }}>
//         {status?.hasFreeCall ? (
//           <p style={{ color: "#16a34a", fontWeight: 600 }}>🎁 You have a FREE 5-minute call available!</p>
//         ) : (
//           <p style={{ color: "#ea580c", fontWeight: 600 }}>✅ Free call used. Buy a plan to continue.</p>
//         )}
//       </div>

//       {status?.activePlans?.length > 0 && (
//         <div style={{ marginBottom: 24 }}>
//           <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Your Active Plans</h2>
//           {status.activePlans.map((p, i) => (
//             <div key={i} style={{
//               background: "#f5f5f5", borderRadius: 10,
//               padding: 12, marginBottom: 8,
//               display: "flex", justifyContent: "space-between",
//             }}>
//               <span style={{ fontWeight: 500 }}>{p.name}</span>
//               <span style={{ color: "#341539", fontWeight: 700 }}>{p.remainingSeconds} min left</span>
//             </div>
//           ))}
//         </div>
//       )}

//       {message && (
//         <div style={{ padding: 12, borderRadius: 8, background: "#f0f0f0", marginBottom: 16 }}>
//           {message}
//         </div>
//       )}

//       <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Buy a Plan</h2>
//       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
//         {plans.map((plan) => (
//           <div key={plan.id} style={{
//             border: "1px solid #e5e7eb", borderRadius: 14,
//             padding: 16, background: "white",
//           }}>
//             <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{plan.name}</p>
//             <p style={{ color: "#341539", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
//               ₹{(plan.price / 100).toFixed(0)}
//             </p>
//             <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
//               {plan.minutes} min · {plan.validDays} days
//             </p>
//             {plan.perDayLimit && (
//               <p style={{ color: "#f59e0b", fontSize: 12, marginBottom: 4 }}>
//                 ⚡ {plan.perDayLimit} min/day limit
//               </p>
//             )}
//             {plan.includes?.length > 0 && (
//               <p style={{ color: "#16a34a", fontSize: 12, marginBottom: 8 }}>
//                 🎁 {plan.includes.join(", ")}
//               </p>
//             )}
//             <button
//               onClick={() => handleBuy(plan)}
//               disabled={buying === plan.id}
//               style={{
//                 width: "100%", padding: "10px 0",
//                 background: "#341539", color: "white",
//                 border: "none", borderRadius: 8,
//                 fontWeight: 600, cursor: "pointer",
//                 opacity: buying === plan.id ? 0.6 : 1,
//               }}
//             >
//               {buying === plan.id ? "Activating..." : "Buy Now"}
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
"use client";
import { useState } from "react";

function formatSeconds(seconds) {
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${seconds}s`;
}

export default function PlansClient({ plans, status, userId }) {
  const [buying, setBuying] = useState(null);
  const [message, setMessage] = useState("");

  async function handleBuy(plan) {
    if (!userId) { setMessage("❌ Please login first."); return; }
    setBuying(plan.id);
    setMessage("");
    const res = await fetch("/api/plans/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: plan.id }),
    });
    const data = await res.json();
    setBuying(null);
    if (res.ok) {
      setMessage("✅ Plan activated!");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setMessage(`❌ ${data.error}`);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Talktime Plans</h1>

      <div style={{
        background: status?.hasFreeCall ? "#f0fdf4" : "#fef9f0",
        border: `1px solid ${status?.hasFreeCall ? "#bbf7d0" : "#fed7aa"}`,
        borderRadius: 12, padding: 16, marginBottom: 24,
      }}>
        {status?.hasFreeCall
          ? <p style={{ color: "#16a34a", fontWeight: 600 }}>🎁 You have a FREE 5-second call available! (test)</p>
          : <p style={{ color: "#ea580c", fontWeight: 600 }}>✅ Free call used. Buy a plan to continue.</p>
        }
      </div>

      {status?.activePlans?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Your Active Plans</h2>
          {status.activePlans.map((p, i) => {
            const endDate = new Date(p.endDate);
            const daysLeft = Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <div key={i} style={{ background: "#f5f5f5", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: "#341539", fontWeight: 700 }}>
                    {formatSeconds(p.remainingSeconds)} left
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280", fontSize: 12 }}>
                    Expires: {endDate.toLocaleDateString("en-IN")}
                  </span>
                  <span style={{ color: daysLeft <= 3 ? "#ef4444" : "#6b7280", fontSize: 12 }}>
                    {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                  </span>
                </div>
                {p.perDayLimit && (
                  <p style={{ color: "#f59e0b", fontSize: 12, marginTop: 4 }}>
                    ⚡ {formatSeconds(p.perDayLimit - (p.perDayUsedSeconds ?? 0))} remaining today
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {message && (
        <div style={{ padding: 12, borderRadius: 8, background: "#f0f0f0", marginBottom: 16 }}>
          {message}
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Buy a Plan</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {plans.map((plan) => (
          <div key={plan.id} style={{
            border: "1px solid #e5e7eb", borderRadius: 14, padding: 16, background: "white",
          }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{plan.name}</p>
            <p style={{ color: "#341539", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              ₹{(plan.price / 100).toFixed(0)}
            </p>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
              {formatSeconds(plan.seconds)} · {plan.validDays} days
            </p>
            {plan.perDayLimit && (
              <p style={{ color: "#f59e0b", fontSize: 12, marginBottom: 4 }}>
                ⚡ {formatSeconds(plan.perDayLimit)}/day limit
              </p>
            )}
            {plan.includes?.length > 0 && (
              <p style={{ color: "#16a34a", fontSize: 12, marginBottom: 8 }}>
                🎁 {plan.includes.join(", ")}
              </p>
            )}
            <button
              onClick={() => handleBuy(plan)}
              disabled={buying === plan.id}
              style={{
                width: "100%", padding: "10px 0",
                background: "#341539", color: "white",
                border: "none", borderRadius: 8,
                fontWeight: 600, cursor: "pointer",
                opacity: buying === plan.id ? 0.6 : 1,
              }}
            >
              {buying === plan.id ? "Activating..." : "Buy Now (Test)"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
