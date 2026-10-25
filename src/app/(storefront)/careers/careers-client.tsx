"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Heart,
  Zap,
  Coffee,
  X,
  Send,
  Building,
  Users,
} from "lucide-react";
import { useStore } from "@/components/store-context";

interface JobListing {
  id: string;
  title: string;
  department: "Design" | "Operations" | "Marketing" | "Engineering";
  location: string;
  type: "Full-Time" | "Contract" | "Internship";
  experience: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
}

const JOBS: JobListing[] = [
  {
    id: "apparel-designer",
    title: "Senior Apparel Designer (Heavyweight & Tailoring)",
    department: "Design",
    location: "Mumbai Studio (Hybrid)",
    type: "Full-Time",
    experience: "3+ years",
    description:
      "Spearhead the development of our seasonal drops, focusing on structured silhouettes, custom heavyweight knits (280–420 GSM), and minimalist Asian streetwear drapes.",
    responsibilities: [
      "Develop seasonal collections from mood boards to tech packs and pre-production samples",
      "Source and test sustainable heavyweight cottons, loopback terry, and technical nylon blends",
      "Collaborate directly with boutique mills in Tirupur and Mumbai to oversee fit trials and garment wash cycles",
      "Work closely with our creative director on brand visual language and color narratives",
    ],
    requirements: [
      "Degree in Fashion Design or equivalent portfolio demonstrable mastery",
      "Deep understanding of streetwear proportions, oversized drapes, and streetwear culture",
      "Proficiency in Adobe Illustrator, CLO 3D or Browzwear, and comprehensive tech-pack generation",
      "Keen eye for micro-details: bar-tacks, seam bindings, neckband ribbing, and custom hardware",
    ],
  },
  {
    id: "supply-chain-lead",
    title: "E-Commerce Supply Chain & Fulfillment Lead",
    department: "Operations",
    location: "Mumbai Fulfillment Hub",
    type: "Full-Time",
    experience: "2+ years",
    description:
      "Manage domestic dispatch, warehouse quality control, 3PL logistics (Bluedart, Delhivery, Express), and inventory accuracy across all nationwide drop cycles.",
    responsibilities: [
      "Oversee day-to-day warehouse picking, garment steaming, dust-sleeve bagging, and shipping dispatches",
      "Coordinate with third-party logistics partners to guarantee same-day dispatch and 24-48h metro deliveries",
      "Manage return and exchange reverse logistics, minimizing turnaround times and inspecting garment returns",
      "Implement real-time inventory auditing between warehouse racks and Cloud Firestore database",
    ],
    requirements: [
      "Experience with D2C fashion supply chain and courier API integrations in India",
      "Obsession with punctual fulfillment, packaging standards, and zero defect rates",
      "Strong analytical skills with Excel/Sheets and warehouse management systems (WMS)",
      "Ability to thrive in high-velocity drop windows and holiday spikes",
    ],
  },
  {
    id: "visual-content-creator",
    title: "Visual Content Creator & Photographer",
    department: "Marketing",
    location: "Mumbai Studio",
    type: "Full-Time",
    experience: "1+ years",
    description:
      "Capture the soul of NXTIVE through raw, cinematic editorial photography, short-form reels/TikToks, and campaign lookbooks reflecting modern Asian streetwear aesthetics.",
    responsibilities: [
      "Shoot and grade high-fashion editorial campaigns, lookbooks, and studio e-commerce flat-lays",
      "Produce engaging short-form video content documenting fabric drape, styling guides, and studio BTS",
      "Direct model castings, location scouting, and aesthetic lighting setups in our studio",
      "Maintain a cohesive aesthetic mood across Instagram, Pinterest, and website banners",
    ],
    requirements: [
      "Stunning portfolio showcasing fashion, streetwear, or editorial portraiture",
      "Proficiency with Sony/Canon mirrorless systems, DaVinci Resolve / Premiere Pro, and Lightroom",
      "Finger on the pulse of global youth culture, underground fashion trends, and minimalist aesthetics",
      "Self-starter capable of taking a creative concept from storyboard to final color grade",
    ],
  },
  {
    id: "fullstack-engineer",
    title: "Full-Stack Web Engineer (Next.js & Cloud)",
    department: "Engineering",
    location: "Remote / Bengaluru",
    type: "Full-Time",
    experience: "2+ years",
    description:
      "Build blazing-fast, immersive shopping experiences on our Next.js App Router, Razorpay payments infrastructure, and realtime Firebase administrative dashboard.",
    responsibilities: [
      "Architect and optimize high-conversion storefront flows, sub-second checkout, and mobile interactions",
      "Enhance internal admin tools for catalog inventory, coupon orchestration, and automated tracking webhooks",
      "Maintain rigorous unit and integration test coverage across payments and security rules",
      "Implement smooth micro-interactions, responsive CSS layouts, and Core Web Vital performance metrics",
    ],
    requirements: [
      "Strong command of TypeScript, Next.js (App Router, Server Actions, Server Components), and React",
      "Experience with Firebase / Google Cloud, transactional APIs, and third-party payment gateways",
      "Appreciation for pristine UI typography, design systems, and mobile ergonomics",
      "Track record of shipping clean, maintainable code with high test rigor",
    ],
  },
  {
    id: "community-intern",
    title: "Brand Community & Social Media Intern",
    department: "Marketing",
    location: "Remote",
    type: "Internship",
    experience: "Student or Fresh Graduate",
    description:
      "Engage with our loyal streetwear community, coordinate creator sample seeding, and cultivate our presence across fashion Discord, Instagram DMs, and Reddit communities.",
    responsibilities: [
      "Manage real-time customer conversations across social channels with a modern, authentic tone",
      "Identify emerging streetwear micro-influencers and stylists for capsule gifting",
      "Assist with planning pop-up store events and underground launch parties",
      "Collect community feedback on sizing, garment feel, and desired future drops",
    ],
    requirements: [
      "Active participant in streetwear culture and contemporary menswear communities",
      "Exceptional written English communication with empathy and brand voice consistency",
      "High energy, curiosity, and eagerness to learn fashion brand building from the inside out",
      "Proficiency with Instagram, TikTok, and community platforms",
    ],
  },
];

const PERKS = [
  {
    icon: <Sparkles size={20} color="#936037" />,
    title: "Generous Wardrobe Allowance",
    desc: "Free seasonal drop allocations and a 50% lifetime family discount on all NXTIVE collections.",
  },
  {
    icon: <Zap size={20} color="#936037" />,
    title: "High Autonomy & Impact",
    desc: "Zero corporate bureaucracy. Test bold creative ideas, execute fast, and see your work worn by thousands.",
  },
  {
    icon: <Coffee size={20} color="#936037" />,
    title: "Flexible Studio Workspaces",
    desc: "Modern open-plan creative studios in Mumbai and Bengaluru with flexible hybrid schedules.",
  },
  {
    icon: <Heart size={20} color="#936037" />,
    title: "Comprehensive Wellness",
    desc: "Medical coverage for you and dependents, mental wellness days, and paid annual sabbatical breaks.",
  },
];

export function CareersClient() {
  const { showToast } = useStore();
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // Application form state
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [coverNote, setCoverNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const departments = ["All", "Design", "Operations", "Marketing", "Engineering"];

  const filteredJobs =
    selectedDept === "All"
      ? JOBS
      : JOBS.filter((job) => job.department === selectedDept);

  const handleOpenApplication = (job: JobListing) => {
    setSelectedJob(job);
    setIsApplying(true);
    setSubmittedSuccess(false);
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail) return;

    setIsSubmitting(true);
    // Simulate server submission
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmittedSuccess(true);
    showToast(`Application submitted for ${selectedJob?.title}!`);
  };

  return (
    <div style={{ backgroundColor: "var(--bg-sand)", minHeight: "100vh", paddingBottom: "100px" }}>
      {/* Hero Header */}
      <section
        style={{
          backgroundColor: "#111110",
          color: "#FFFFFF",
          padding: "80px 20px 90px 20px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            backgroundImage: "radial-gradient(#FFFFFF 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="container" style={{ position: "relative", zIndex: 1, maxWidth: "760px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#936037",
              display: "inline-block",
              marginBottom: "14px",
            }}
          >
            Careers at NXTIVE
          </span>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              textTransform: "uppercase",
              marginBottom: "18px",
            }}
          >
            Build The Future Of Asian Streetwear
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#A8A29A",
              lineHeight: "1.65",
              maxWidth: "600px",
              margin: "0 auto 28px auto",
            }}
          >
            We are architects of modern drape, heavyweight craftsmanship, and minimal design. Join our collective of designers, builders, and storytellers.
          </p>

          <a
            href="#open-roles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#FFFFFF",
              color: "#111110",
              padding: "12px 28px",
              borderRadius: "9999px",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "transform 0.2s ease",
            }}
          >
            <span>Explore Open Roles</span>
            <ArrowRight size={15} />
          </a>
        </div>
      </section>

      {/* Perks & Culture Grid */}
      <section className="container" style={{ paddingTop: "60px", paddingBottom: "60px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#936037",
            }}
          >
            Why Join Our Studio
          </span>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              color: "#111110",
              marginTop: "8px",
            }}
          >
            Creativity Without Compromise
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {PERKS.map((perk) => (
            <div
              key={perk.title}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "28px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 4px 18px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(147, 96, 55, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                {perk.icon}
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
                {perk.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.6", margin: 0 }}>
                {perk.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles Section */}
      <section id="open-roles" className="container" style={{ paddingTop: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "32px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            paddingBottom: "20px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#936037",
              }}
            >
              Current Opportunities
            </span>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: 900,
                textTransform: "uppercase",
                color: "#111110",
                marginTop: "4px",
              }}
            >
              Open Positions ({filteredJobs.length})
            </h2>
          </div>

          {/* Department Filter Tabs */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {departments.map((dept) => {
              const active = selectedDept === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "9999px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: active ? "1px solid #111110" : "1px solid rgba(0,0,0,0.12)",
                    backgroundColor: active ? "#111110" : "#FFFFFF",
                    color: active ? "#FFFFFF" : "#555",
                    transition: "all 0.15s ease",
                  }}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>

        {/* Roles List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "26px 30px",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.02)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "20px",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ maxWidth: "680px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      backgroundColor: "rgba(147, 96, 55, 0.12)",
                      color: "#936037",
                    }}
                  >
                    {job.department}
                  </span>
                  <span style={{ fontSize: "12px", color: "#8E8880", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={13} /> {job.location}
                  </span>
                  <span style={{ fontSize: "12px", color: "#8E8880", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} /> {job.type}
                  </span>
                  <span style={{ fontSize: "12px", color: "#8E8880" }}>• Exp: {job.experience}</span>
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "6px" }}>
                  {job.title}
                </h3>
                <p style={{ fontSize: "13px", color: "#6A645C", lineHeight: "1.6", margin: 0 }}>
                  {job.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenApplication(job)}
                style={{
                  padding: "11px 22px",
                  borderRadius: "9999px",
                  backgroundColor: "#111110",
                  color: "#FFFFFF",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  cursor: "pointer",
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "background-color 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <span>View & Apply</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Speculative Application Card */}
        <div
          style={{
            marginTop: "48px",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "36px",
            textAlign: "center",
            border: "1px dashed rgba(147, 96, 55, 0.4)",
            maxWidth: "680px",
            margin: "48px auto 0 auto",
          }}
        >
          <Briefcase size={28} color="#936037" style={{ margin: "0 auto 12px auto" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#111110", marginBottom: "8px" }}>
            Don't see your specific role listed?
          </h3>
          <p style={{ fontSize: "13.5px", color: "#6A645C", maxWidth: "520px", margin: "0 auto 18px auto", lineHeight: "1.6" }}>
            We're always looking to connect with exceptional stylists, pattern makers, videographers, and brand operators. Drop us a line with your portfolio.
          </p>
          <a
            href="mailto:careers@nxtive.com?subject=Speculative%20Application%20%E2%80%94%20NXTIVE"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 22px",
              borderRadius: "9999px",
              border: "1px solid #111110",
              backgroundColor: "transparent",
              color: "#111110",
              fontSize: "12.5px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <span>Email careers@nxtive.com</span>
            <ArrowRight size={13} />
          </a>
        </div>
      </section>

      {/* Application Modal */}
      {isApplying && selectedJob && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setIsApplying(false)}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "640px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "36px",
              position: "relative",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsApplying(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                color: "#666",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
              }}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            {submittedSuccess ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <CheckCircle2 size={48} color="#2B9348" style={{ margin: "0 auto 16px auto" }} />
                <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#111110", marginBottom: "8px" }}>
                  Application Dispatched
                </h3>
                <p style={{ fontSize: "14px", color: "#666", maxWidth: "460px", margin: "0 auto 24px auto" }}>
                  Thank you for applying for <strong>{selectedJob.title}</strong>. Our creative recruitment team reviews every portfolio and will get in touch within 3 business days.
                </p>
                <button
                  type="button"
                  onClick={() => setIsApplying(false)}
                  style={{
                    padding: "10px 24px",
                    borderRadius: "9999px",
                    backgroundColor: "#111110",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#936037",
                  }}
                >
                  {selectedJob.department} • {selectedJob.location}
                </span>
                <h2 style={{ fontSize: "22px", fontWeight: 900, color: "#111110", marginTop: "4px", marginBottom: "16px" }}>
                  {selectedJob.title}
                </h2>

                <div style={{ marginBottom: "24px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "8px" }}>
                    Core Responsibilities
                  </h4>
                  <ul style={{ paddingLeft: "18px", fontSize: "12.5px", color: "#555", lineHeight: "1.65", margin: 0 }}>
                    {selectedJob.responsibilities.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <form onSubmit={handleApplicationSubmit}>
                  <h4 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#111110", marginBottom: "12px", borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "18px" }}>
                    Your Information
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Aarav Sharma"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        placeholder="aarav@example.com"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                        Portfolio / LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://behance.net/..."
                        style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#444", marginBottom: "4px" }}>
                      Why NXTIVE? (Short note)
                    </label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Tell us what excites you about modern minimalist menswear and how you see yourself shaping our craft..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.15)", fontSize: "13px", resize: "vertical" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: "9999px",
                      backgroundColor: "#111110",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? "Submitting Portfolio…" : "Submit Application"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
