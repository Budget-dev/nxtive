"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, BarChart3, Award, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/utils/format-currency";
import { getAdminAnalytics, type AdminAnalytics } from "@/features/admin-dashboard/server/actions";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

const CHART_COLORS = ["#F2AC24", "#3B82F6", "#8B5CF6", "#10B981", "#EC4899"];

function percent(value: number | null): string {
  return value === null ? "Not available" : `${value.toFixed(1)}%`;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalytics(await getAdminAnalytics());
    } catch (err) {
      setAnalytics(null);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px", color: "var(--adm-text-muted)" }}>Loading Firestore analytics...</div>;
  }

  if (error || !analytics) {
    return (
      <AdminDataState
        title="Analytics data unavailable"
        message={error || "Analytics could not be loaded."}
        actionLabel="Retry"
        onAction={loadAnalytics}
      />
    );
  }

  if (analytics.dataState === "empty") {
    return (
      <AdminDataState
        title="No analytics data in Firestore"
        message="Analytics will appear after orders and products have been recorded in Firestore."
      />
    );
  }

  return (
    <div>
      <div className="admin-panel" style={{ marginBottom: "24px" }}>
        <div className="admin-panel-header">
          <div className="admin-panel-title-wrap">
            <h3>Merchandise Analytics &amp; Conversion Insights</h3>
            <p>Derived from the orders and products currently stored in Firestore.</p>
          </div>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--adm-gold)" }}>
            Firestore records
          </span>
        </div>
      </div>

      <div className="admin-metrics-grid" style={{ marginBottom: "24px" }}>
        <div className="admin-metric-card gold">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Gross Merchandise Value</span>
            <div className="admin-metric-icon-wrap gold"><TrendingUp size={18} /></div>
          </div>
          <div className="admin-metric-value">{formatCurrency(analytics.grossMerchandiseValue)}</div>
          <div className="admin-metric-footer">
            <span className="admin-metric-subtext">Recorded non-cancelled orders</span>
          </div>
        </div>

        <div className="admin-metric-card blue">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Checkout Conversion Rate</span>
            <div className="admin-metric-icon-wrap blue"><BarChart3 size={18} /></div>
          </div>
          <div className="admin-metric-value">{percent(analytics.checkoutConversionRate)}</div>
          <div className="admin-metric-footer">
            <span className="admin-metric-subtext">Checkout attempts are not stored</span>
          </div>
        </div>

        <div className="admin-metric-card green">
          <div className="admin-metric-header">
            <span className="admin-metric-title">Customer Repeat Rate</span>
            <div className="admin-metric-icon-wrap green"><Award size={18} /></div>
          </div>
          <div className="admin-metric-value">{percent(analytics.repeatRate)}</div>
          <div className="admin-metric-footer">
            <span className="admin-metric-subtext">Customers with more than one order</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px", marginBottom: "32px" }}>
        <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "4px" }}>
            Sales Volume by Apparel Category
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--adm-text-muted)", marginBottom: "20px" }}>
            Revenue derived from recorded order line items.
          </p>
          {analytics.categoryShare.length === 0 ? (
            <p style={{ color: "var(--adm-text-muted)", fontSize: "13px" }}>No categorized line items are available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {analytics.categoryShare.map((item, index) => (
                <div key={item.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.84rem" }}>
                    <span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{item.name}</span>
                    <span style={{ color: "var(--adm-text-secondary)" }}>
                      {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div style={{ height: "8px", borderRadius: "999px", backgroundColor: "#141312", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, item.percentage)}%`, backgroundColor: CHART_COLORS[index % CHART_COLORS.length], borderRadius: "999px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-panel" style={{ margin: 0, padding: "24px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--adm-text)", marginBottom: "4px" }}>
            Payment Method Share
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--adm-text-muted)", marginBottom: "20px" }}>
            Share of non-cancelled Firestore orders by payment method.
          </p>
          {analytics.paymentShare.length === 0 ? (
            <p style={{ color: "var(--adm-text-muted)", fontSize: "13px" }}>No payment methods are available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {analytics.paymentShare.map((payment, index) => (
                <div key={payment.method} style={{ padding: "14px 16px", borderRadius: "10px", backgroundColor: "#141312", border: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                    <span style={{ fontSize: "0.85rem", color: "var(--adm-text)", fontWeight: 500 }}>{payment.method}</span>
                  </div>
                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FBF9F5" }}>{payment.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div className="admin-panel-title-wrap">
            <h3>Top Performing Garments</h3>
            <p>Products ranked by revenue from recorded order line items.</p>
          </div>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product Title</th>
                <th>Category</th>
                <th>Units Sold</th>
                <th>Gross Revenue</th>
                <th>Return Rate</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {analytics.bestsellers.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--adm-text-muted)" }}>No product sales are available.</td></tr>
              ) : analytics.bestsellers.map((item, index) => (
                <tr key={`${item.title}-${index}`}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "50%", backgroundColor: index === 0 ? "rgba(242, 172, 36, 0.2)" : "rgba(255, 255, 255, 0.05)", color: index === 0 ? "#F2AC24" : "var(--adm-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>#{index + 1}</span>
                      <span style={{ fontWeight: 700, color: "var(--adm-text)" }}>{item.title}</span>
                    </div>
                  </td>
                  <td><span style={{ fontSize: "0.8rem", color: "var(--adm-text-secondary)" }}>{item.category}</span></td>
                  <td><span style={{ fontWeight: 600, color: "var(--adm-text)" }}>{item.unitsSold} pcs</span></td>
                  <td><span style={{ fontWeight: 700, color: "#F2AC24" }}>{formatCurrency(item.revenue)}</span></td>
                  <td><span style={{ fontSize: "0.82rem", color: item.returnRate === null ? "var(--adm-text-muted)" : "#10B981" }}>{percent(item.returnRate)}</span></td>
                  <td><span className="admin-badge success"><ArrowUpRight size={12} /> Recorded</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
