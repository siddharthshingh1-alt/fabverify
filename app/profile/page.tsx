"use client";

import { useState } from "react";
import Link from "next/link";
import ThreePanelLayout from "../components/ThreePanelLayout";
import TopBar from "../components/TopBar";
import { UploadBox } from "../onboarding/components";
import { useUser } from "../context/UserContext";
import screenConfig from "../config/screens";

const UNIT_OPTIONS = ["pieces", "metres", "kg", "per project"];

const TIER_ORDER = ["unverified", "bronze", "silver", "gold", "platinum"] as const;

const TIER_COLORS: Record<string, string> = {
  unverified: "#7A8FA8",
  bronze: "#CD7F32",
  silver: "#94a3b8",
  gold: "#f2ca50",
  platinum: "#e2e8f0",
};

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  priceMin: string;
  priceMax: string;
  unit: string;
  moq: string;
  photos: (string | undefined)[];
};

const EMPTY_FORM = {
  name: "",
  category: "",
  description: "",
  priceMin: "",
  priceMax: "",
  unit: UNIT_OPTIONS[0],
  moq: "",
};

export default function Profile() {
  const { user, userLabel, isSupplySide, isTalent } = useUser();
  const config = screenConfig.profile[user.userType];

  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photos, setPhotos] = useState<(string | undefined)[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<(string | undefined)[]>([]);

  const updateForm = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setPhotos([]);
  };

  const handleSaveProduct = () => {
    if (!form.name.trim()) return;
    setProducts((current) => [
      ...current,
      { id: `${Date.now()}`, ...form, photos },
    ]);
    resetForm();
    setShowAddForm(false);
  };

  const tierIndex = TIER_ORDER.indexOf(user.verificationTier);
  const nextTier = TIER_ORDER[tierIndex + 1];

  const checklist = [
    { label: "Basic info added", done: true },
    { label: "Verification completed", done: user.verificationTier !== "unverified" },
    { label: "Products/services listed", done: products.length > 0 },
    { label: "Portfolio uploaded", done: portfolioFiles.some(Boolean) },
    { label: "First order completed", done: false },
  ];
  const completionPercent = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100
  );

  const centrePanel = (
    <>
      <TopBar
        title="My Profile"
        rightContent={
          <button
            type="button"
            className="rounded-lg border border-primary px-4 py-2 text-sm font-bold text-primary"
          >
            Edit Profile
          </button>
        }
      />

      <div className="px-6 py-6">
        <div className="rounded-xl border border-border-dark bg-card p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] border-2 border-primary text-3xl"
              style={{ backgroundColor: "#07122a" }}
            >
              {config.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-white">{user.name}</p>
              <p className="mt-0.5 text-[13px] font-semibold text-primary">
                {userLabel}
              </p>
              <p className="mt-0.5 text-[13px] text-text-secondary">
                {user.city || "City not set"}
              </p>
              <span
                className="mt-2 inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
                style={{
                  borderColor: TIER_COLORS[user.verificationTier],
                  color: TIER_COLORS[user.verificationTier],
                  backgroundColor: `${TIER_COLORS[user.verificationTier]}1f`,
                }}
              >
                {user.verificationTier} Verified
              </span>
            </div>

            <div className="shrink-0 text-center sm:text-right">
              <p className="font-display text-[28px] font-bold text-primary">
                {user.fabscore > 0 ? user.fabscore : "—"}
              </p>
              <p className="text-[11px] text-text-secondary">FabScore</p>
              {user.fabscore === 0 && (
                <p className="mt-0.5 text-[10px] text-text-secondary">
                  Complete verification to unlock
                </p>
              )}
            </div>
          </div>
        </div>

        {isSupplySide && (
          <div className="mt-8">
            <h2 className="text-base font-bold text-white">
              My Products / Services
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              {config.catalogueSubtitle}
            </p>

            {products.length > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-[10px] border border-border-dark bg-card p-4"
                  >
                    <p className="text-sm font-bold text-white">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="mt-1 text-xs text-text-secondary">
                        {product.category}
                      </p>
                    )}
                    {product.description && (
                      <p className="mt-2 text-xs text-text-secondary">
                        {product.description}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-dark pt-3 text-xs text-text-secondary">
                      {(product.priceMin || product.priceMax) && (
                        <span>
                          ₹{product.priceMin || "0"}–₹{product.priceMax || "0"}
                          {product.unit ? ` / ${product.unit}` : ""}
                        </span>
                      )}
                      {product.moq && <span>MOQ: {product.moq}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!showAddForm && products.length === 0 && (
              <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
                <div className="text-5xl">📦</div>
                <p className="mt-4 text-base font-bold text-white">
                  No products listed yet
                </p>
                <p className="mt-2 max-w-[400px] text-[13px] text-text-secondary">
                  Add your first product to start receiving enquiries from
                  buyers
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mt-5 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
                >
                  + Add Product
                </button>
              </div>
            )}

            {!showAddForm && products.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="mt-4 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-navy"
              >
                + Add Product
              </button>
            )}

            {showAddForm && (
              <div className="mt-4 rounded-xl border border-border-dark bg-card p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Product / Service name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(event) => updateForm("name", event.target.value)}
                      className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        updateForm("category", event.target.value)
                      }
                      className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    >
                      <option value="">Select...</option>
                      {config.categoryOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        updateForm("description", event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Price range
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={form.priceMin}
                        onChange={(event) =>
                          updateForm("priceMin", event.target.value)
                        }
                        placeholder="₹ min"
                        className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                      />
                      <span className="text-text-secondary">–</span>
                      <input
                        type="number"
                        min={0}
                        value={form.priceMax}
                        onChange={(event) =>
                          updateForm("priceMax", event.target.value)
                        }
                        placeholder="₹ max"
                        className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Unit
                    </label>
                    <select
                      value={form.unit}
                      onChange={(event) => updateForm("unit", event.target.value)}
                      className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    >
                      {UNIT_OPTIONS.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      MOQ
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.moq}
                      onChange={(event) => updateForm("moq", event.target.value)}
                      className="w-full rounded-[6px] border border-border-dark bg-navy px-3 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                      Photos — Add up to 3 photos
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[0, 1, 2].map((index) => (
                        <UploadBox
                          key={index}
                          emoji="📤"
                          title={`Photo ${index + 1}`}
                          fileName={photos[index]}
                          onFile={(file) =>
                            setPhotos((current) => {
                              const next = [...current];
                              next[index] = file?.name;
                              return next;
                            })
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="text-sm font-medium text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProduct}
                    disabled={!form.name.trim()}
                    className={`rounded-lg px-8 py-3 text-sm font-bold transition-colors ${
                      form.name.trim()
                        ? "cursor-pointer bg-primary text-navy"
                        : "cursor-not-allowed bg-border-dark text-text-secondary"
                    }`}
                  >
                    Save Product
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isTalent && (
          <div className="mt-8">
            <h2 className="text-base font-bold text-white">My Portfolio</h2>

            {portfolioFiles.filter(Boolean).length === 0 ? (
              <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-border-dark bg-card px-6 py-12 text-center">
                <div className="text-5xl">🖼️</div>
                <p className="mt-4 text-base font-bold text-white">
                  No portfolio items yet
                </p>
                <p className="mt-2 max-w-[400px] text-[13px] text-text-secondary">
                  Upload samples of your work so brands can see what you can
                  do
                </p>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <UploadBox
                  key={index}
                  emoji="📤"
                  title={`Upload ${index + 1}`}
                  subtitle="JPG, PNG or PDF"
                  fileName={portfolioFiles[index]}
                  onFile={(file) =>
                    setPortfolioFiles((current) => {
                      const next = [...current];
                      next[index] = file?.name;
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const rightPanel = (
    <>
      <p className="text-base font-bold text-white">Profile Strength</p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border-dark">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-text-secondary">
        {completionPercent}% complete
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {checklist.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-sm text-text-primary"
          >
            <span>{item.done ? "✅" : "☐"}</span>
            <span className={item.done ? "" : "text-text-secondary"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-text-secondary">
        Complete your profile to get more enquiries
      </p>

      <div className="my-5 h-px bg-border-dark" />

      <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
        Verification
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span
          className="inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize"
          style={{
            borderColor: TIER_COLORS[user.verificationTier],
            color: TIER_COLORS[user.verificationTier],
            backgroundColor: `${TIER_COLORS[user.verificationTier]}1f`,
          }}
        >
          {user.verificationTier}
        </span>
      </div>
      {nextTier ? (
        <Link
          href="/verification"
          className="mt-3 block rounded-lg bg-primary py-2 text-center text-xs font-bold text-navy"
        >
          Upgrade to {nextTier[0].toUpperCase() + nextTier.slice(1)} →
        </Link>
      ) : (
        <p className="mt-3 text-[11px] text-text-secondary">
          You have reached the highest verification tier
        </p>
      )}
    </>
  );

  return (
    <ThreePanelLayout
      centre={centrePanel}
      right={<div style={{ padding: "20px" }}>{rightPanel}</div>}
    />
  );
}
