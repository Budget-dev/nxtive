"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Filter,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import {
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteReview,
} from "@/features/admin-dashboard/server/actions";
import type { Review, ReviewStatus } from "@/types/review";
import { AdminDataState, adminErrorMessage } from "../_components/admin-data-state";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [approveModal, setApproveModal] = useState<Review | null>(null);
  const [rejectModal, setRejectModal] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteModal, setDeleteModal] = useState<Review | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminReviews({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
      });
      setReviews(data);
    } catch (err) {
      console.error(err);
      setReviews([]);
      setError(adminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReviews();
  };

  const handleConfirmApprove = async () => {
    if (!approveModal) return;
    const id = approveModal.id;
    setActionLoading(id);
    setApproveModal(null);
    try {
      const result = await approveReview(id);
      if (!result.success) throw new Error(result.error || "Failed to approve review");
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "approved" as ReviewStatus } : r))
      );
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    const id = rejectModal.id;
    setActionLoading(id);
    const reason = rejectReason.trim() || "Rejected by administrator";
    setRejectModal(null);
    setRejectReason("");
    try {
      const result = await rejectReview(id, "Admin", reason);
      if (!result.success) throw new Error(result.error || "Failed to reject review");
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: "rejected" as ReviewStatus, moderationNotes: reason } : r
        )
      );
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    const id = deleteModal.id;
    setActionLoading(id);
    setDeleteModal(null);
    try {
      const result = await deleteReview(id);
      if (!result.success) throw new Error(result.error || "Failed to delete review");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(adminErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  if (error && reviews.length === 0 && !loading) {
    return (
      <AdminDataState
        title="Review data unavailable"
        message={error}
        actionLabel="Retry"
        onAction={loadReviews}
      />
    );
  }

  return (
    <div>
      {error && <div style={{ marginBottom: "20px" }}><AdminDataState title="Review operation failed" message={error} /></div>}
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#121110", letterSpacing: "-0.02em" }}>
            Review Management
          </h1>
          <p style={{ fontSize: "14px", color: "var(--adm-text-muted)", marginTop: "4px" }}>
            Customer submissions require administrative approval before displaying publicly on product pages
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: "9999px",
              backgroundColor: "var(--adm-badge-amber-bg)",
              color: "var(--adm-badge-amber-text)",
              fontSize: "12.5px",
              fontWeight: 700,
            }}
          >
            {pendingCount} Pending Moderation
          </span>
        </div>
      </div>

      {/* Workflow Information Banner */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "10px",
          backgroundColor: "#FFFFFF",
          border: "1px solid var(--adm-border)",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
          color: "var(--adm-text-secondary)",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            backgroundColor: "var(--adm-sand-pill)",
            color: "#121110",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "12px",
            flexShrink: 0,
          }}
        >
          ✓
        </div>
        <div>
          <strong>Quality Safeguard Active:</strong> Customer-submitted reviews remain in <code>pending</code> status and are hidden from the public storefront until verified and approved.
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="admin-card" style={{ marginBottom: "20px", padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { key: "all", label: "All Reviews" },
              { key: "pending", label: "Pending", count: pendingCount },
              { key: "approved", label: "Approved" },
              { key: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: "7px 14px",
                  borderRadius: "8px",
                  border: "1px solid",
                  borderColor: statusFilter === tab.key ? "#121110" : "var(--adm-border)",
                  backgroundColor: statusFilter === tab.key ? "#121110" : "#FFFFFF",
                  color: statusFilter === tab.key ? "#FFFFFF" : "var(--adm-text-secondary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    style={{
                      fontSize: "10.5px",
                      padding: "1px 6px",
                      borderRadius: "9999px",
                      backgroundColor: statusFilter === tab.key ? "rgba(255,255,255,0.2)" : "var(--adm-badge-amber-bg)",
                      color: statusFilter === tab.key ? "#FFFFFF" : "var(--adm-badge-amber-text)",
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} className="admin-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, apparel, or text..."
              className="admin-input"
              style={{ paddingLeft: "36px" }}
            />
          </form>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Review Content</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>Loading customer reviews...</div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--adm-text-muted)" }}>No reviews have been recorded in Firestore for this filter.</div>
                  </td>
                </tr>
              ) : (
                reviews.map((r) => {
                  let badgeClass = "amber";
                  if (r.status === "approved") badgeClass = "green";
                  else if (r.status === "rejected") badgeClass = "red";

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={r.userAvatar || "/images/nxtvie/gallery-1.jpg"}
                            alt={r.userName}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid var(--adm-border-light)",
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#121110" }}>
                              {r.userName}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--adm-text-muted)" }}>
                              {r.verifiedBuyer ? "Verified Buyer" : "Guest"}
                              {r.sizePurchased && ` • Size ${r.sizePurchased}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {r.productImage && (
                            <img
                              src={r.productImage}
                              alt={r.productTitle}
                              style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover" }}
                            />
                          )}
                          <div style={{ fontWeight: 600, fontSize: "13px" }}>{r.productTitle}</div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", color: "#F2AC24" }}>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < r.rating ? "#F2AC24" : "none"}
                              stroke="#F2AC24"
                            />
                          ))}
                        </div>
                      </td>
                      <td style={{ maxWidth: "320px" }}>
                        {r.title && <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "2px" }}>{r.title}</div>}
                        <div style={{ fontSize: "12.5px", color: "var(--adm-text-secondary)", lineHeight: 1.4 }}>
                          {r.comment}
                        </div>
                        {r.moderationNotes && (
                          <div style={{ fontSize: "11px", color: "#C5221F", marginTop: "4px" }}>
                            <em>Note: {r.moderationNotes}</em>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--adm-text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(r.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className={`admin-badge ${badgeClass}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {r.status !== "approved" && (
                            <button
                              onClick={() => setApproveModal(r)}
                              disabled={actionLoading === r.id}
                              style={{
                                padding: "4px 8px",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "var(--adm-badge-green-bg)",
                                color: "var(--adm-badge-green-text)",
                                cursor: "pointer",
                              }}
                              title="Approve Review"
                            >
                              Approve
                            </button>
                          )}

                          {r.status !== "rejected" && (
                            <button
                              onClick={() => setRejectModal(r)}
                              disabled={actionLoading === r.id}
                              style={{
                                padding: "4px 8px",
                                fontSize: "11.5px",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: "none",
                                backgroundColor: "var(--adm-badge-red-bg)",
                                color: "var(--adm-badge-red-text)",
                                cursor: "pointer",
                              }}
                              title="Reject Review"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteModal(r)}
                            className="admin-icon-button"
                            style={{ width: "28px", height: "28px", color: "var(--adm-text-muted)" }}
                            title="Delete Review"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination">
          <span style={{ fontSize: "12.5px", color: "var(--adm-text-muted)" }}>
            Showing {reviews.length} customer reviews
          </span>
        </div>
      </div>

      {/* ── Approve Confirmation Modal ── */}
      {approveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(18, 17, 16, 0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid var(--adm-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#E6F4EA",
                  color: "#137333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CheckCircle2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#121110", margin: 0 }}>
                  Approve Customer Review?
                </h3>
                <span style={{ fontSize: "12px", color: "#137333", fontWeight: 600 }}>
                  Will publish to live storefront
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--adm-text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
              Are you sure you want to approve this review by <strong>"{approveModal.userName}"</strong> for <strong>"{approveModal.productTitle}"</strong>?
            </p>

            <div
              style={{
                backgroundColor: "#FAF9F6",
                borderRadius: "8px",
                padding: "12px 14px",
                border: "1px solid rgba(0,0,0,0.06)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", color: "#F2AC24", marginBottom: "4px" }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} fill={i < approveModal.rating ? "#F2AC24" : "none"} stroke="#F2AC24" />
                ))}
              </div>
              <p style={{ fontSize: "12.5px", color: "#444", margin: 0, fontStyle: "italic", lineHeight: 1.4 }}>
                "{approveModal.comment.length > 120 ? approveModal.comment.slice(0, 120) + "..." : approveModal.comment}"
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setApproveModal(null)} className="admin-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#137333",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Check size={15} />
                <span>Confirm & Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Confirmation Modal ── */}
      {rejectModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(18, 17, 16, 0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid var(--adm-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#FCE8E6",
                  color: "#C5221F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <XCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#121110", margin: 0 }}>
                  Reject Customer Review?
                </h3>
                <span style={{ fontSize: "12px", color: "#C5221F", fontWeight: 600 }}>
                  Review will remain hidden
                </span>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--adm-text-secondary)", lineHeight: 1.5, marginBottom: "14px" }}>
              Are you sure you want to reject the review by <strong>"{rejectModal.userName}"</strong>?
            </p>

            <div className="admin-form-group" style={{ marginBottom: "20px" }}>
              <label className="admin-label">Reason / Notes (Optional)</label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Inappropriate content, spam, unrelated shipping issue..."
                className="admin-textarea"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setRejectModal(null)} className="admin-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#C5221F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <X size={15} />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(18, 17, 16, 0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
              border: "1px solid var(--adm-border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#FCE8E6",
                  color: "#C5221F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "17px", fontWeight: 800, color: "#121110", margin: 0 }}>
                  Delete Review Permanently?
                </h3>
              </div>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--adm-text-secondary)", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to delete this review by <strong>"{deleteModal.userName}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setDeleteModal(null)} className="admin-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#C5221F",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "13.5px",
                  cursor: "pointer",
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
