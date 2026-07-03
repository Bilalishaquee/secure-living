"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RectificationBanner } from "@/components/rectification/RectificationBanner";
import { Briefcase, RotateCcw, UserCheck } from "lucide-react";

type ProfessionalProfile = {
  id: string;
  userId: string;
  profession: string;
  skillsCsv: string;
  verificationStatus: string;
  bio: string | null;
  isActive: boolean;
};

export default function TenantProfessionalsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [profession, setProfession] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeRectId, setActiveRectId] = useState<string | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${user?.authToken ?? ""}` });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/me/professional", { headers: authHeader() });
      if (res.ok) {
        const { data } = await res.json();
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.authToken]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (profession.length < 2) { setError("Profession is required"); return; }
    if (!skills.trim()) { setError("At least one skill is required"); return; }

    setCreating(true);
    try {
      const res = await fetch("/api/v1/me/professional", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          profession,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          bio: bio || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create profile");
      }
      const { data } = await res.json();
      setProfile(data);
      setProfession("");
      setSkills("");
      setBio("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setCreating(false);
    }
  };

  const VERIFIED_BADGE: Record<string, "success" | "warning" | "error" | "info" | "neutral"> = {
    verified: "success",
    pending: "warning",
    rejected: "error",
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Loading...</div>;
  }

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="app-page-title">Professional Profile</h1>
          <p className="app-page-lead">Manage your professional profile and verification status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProfile}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {profile.profession}
              <Badge variant={VERIFIED_BADGE[profile.verificationStatus.toLowerCase()] ?? "neutral"}>
                {profile.verificationStatus}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Skills</p>
              <p className="text-sm">{profile.skillsCsv}</p>
            </div>
            {profile.bio && (
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Bio</p>
                <p className="text-sm">{profile.bio}</p>
              </div>
            )}

            {(profile.verificationStatus === "REJECTED" || profile.verificationStatus === "rejected") && (
              <RectificationBanner
                module="professional"
                resourceId={profile.id}
                originalStatus={profile.verificationStatus}
                activeRectification={activeRectId ? { id: activeRectId, status: "initiated", deadline: new Date(Date.now() + 10 * 86400000).toISOString() } : null}
                onRectificationStarted={(id) => setActiveRectId(id)}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Create Professional Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profession</label>
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g. Electrician, Plumber, Cleaner"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills (comma-separated)</label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Wiring, Troubleshooting, Installation"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bio (optional)</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
