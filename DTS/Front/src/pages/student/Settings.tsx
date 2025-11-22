import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Mail,
  Image,
  Settings,
  Save,
  BarChart2,
  Brain,
  CheckCircle2,
  Star,
  Award,
  Zap,
} from "lucide-react";
import { palette } from "@/theme/palette";

const UserProfile = () => {
  const [user, setUser] = useState<any>(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/auth/getuserprofile",
        { withCredentials: true }
      );
      setUser(data);
      setEditData({
        username: data.username,
        name: data.name,
        avatarUrl: data.avatarUrl,
        learningPreferences: data.learningPreferences || {},
        email: data.email,
      });
    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handlePreferenceChange = (key, value) => {
    setEditData({
      ...editData,
      learningPreferences: {
        ...editData.learningPreferences,
        [key]: value,
      },
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/auth/update",
        editData,
        { withCredentials: true }
      );
      setMessage(data.message);
      setUser(data.user);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading)
    return (
      <div className="h-[80vh] flex justify-center items-center" style={{ color: palette.text2 }}>
        Loading profile...
      </div>
    );

  if (!user)
    return (
      <div className="h-[80vh] flex justify-center items-center" style={{ color: "#EF4444" }}>
        Failed to load profile.
      </div>
    );

  return (
    <div className="min-h-screen flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6" style={{ background: palette.bg, color: palette.text }}>
      {/* ─── TOP XP SUMMARY ─────────────────────── */}
      <div className="w-full max-w-5xl rounded-2xl shadow-sm mb-6 sm:mb-8" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 text-center p-4 sm:p-6 gap-4">
          {[
            { icon: Star, label: "Level", value: user.level },
            { icon: Zap, label: "XP", value: user.xp },
            { icon: Award, label: "Coins", value: user.coins },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-5 h-5" style={{ color: palette.text }} />
                <span className="font-semibold text-base sm:text-lg" style={{ color: palette.text }}>
                  {stat.value}
                </span>
              </div>
              <p className="text-sm" style={{ color: palette.text2 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MAIN PROFILE SECTION ─────────────────────── */}
      <Card className="w-full max-w-5xl shadow-sm" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: palette.text }}>
            <User className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: palette.text }} /> Profile Overview
          </CardTitle>
        </CardHeader>

        <CardContent className="grid lg:grid-cols-[1fr_2fr] gap-6 sm:gap-10 p-4 sm:p-8">
          {/* ─── LEFT: AVATAR + INFO ─────────────── */}
          <div className="flex flex-col items-center text-center space-y-4 sm:space-y-5">
            <div className="relative">
              <img
                src={
                  editData.avatarUrl ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                }
                alt="Avatar"
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 shadow-lg"
                style={{ borderColor: palette.accent }}
              />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold" style={{ color: palette.text }}>{user.name || user.username}</h2>
            <p className="text-sm" style={{ color: palette.text2 }}>{user.email}</p>

            <div className="flex gap-3 text-center">
              <div>
                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>Focus</p>
                <p className="text-base sm:text-lg font-bold" style={{ color: palette.text }}>{user.focusScore}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>Accuracy</p>
                <p className="text-base sm:text-lg font-bold" style={{ color: palette.text }}>
                  {user.accuracyScore}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm" style={{ color: palette.text2 }}>Mastery</p>
                <p className="text-base sm:text-lg font-bold" style={{ color: palette.text }}>
                  {user.masteryScore}
                </p>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: EDIT FORM ─────────────── */}
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="text-sm flex items-center gap-2 mb-1" style={{ color: palette.text2 }}>
                <User className="w-4 h-4" style={{ color: palette.text }} /> Username
              </label>
              <Input
                name="username"
                value={editData.username || ""}
                onChange={handleChange}
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <div>
              <label className="text-sm flex items-center gap-2 mb-1" style={{ color: palette.text2 }}>
                <Mail className="w-4 h-4" style={{ color: palette.text }} /> Email
              </label>
              <Input
                name="email"
                value={editData.email || ""}
                onChange={handleChange}
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            <div>
              <label className="text-sm flex items-center gap-2 mb-1" style={{ color: palette.text2 }}>
                <Image className="w-4 h-4" style={{ color: palette.text }} /> Avatar URL
              </label>
              <Input
                name="avatarUrl"
                value={editData.avatarUrl || ""}
                onChange={handleChange}
                style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
              />
            </div>

            {/* Preferences */}
            <div className="pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 mb-3" style={{ color: palette.text }}>
                <Settings className="w-4 h-4" /> Learning Preferences
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm mb-1 block" style={{ color: palette.text2 }}>Pace</label>
                  <select
                    value={editData.learningPreferences?.pace || "moderate"}
                    onChange={(e) =>
                      handlePreferenceChange("pace", e.target.value)
                    }
                    className="w-full rounded-lg px-3 py-2"
                    style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}` }}
                  >
                    <option value="slow">Slow</option>
                    <option value="moderate">Moderate</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm mb-1 block" style={{ color: palette.text2 }}>
                    Preferred Topics
                  </label>
                  <Input
                    value={(editData.learningPreferences?.preferredTopics || []).join(", ")}
                    onChange={(e) =>
                      handlePreferenceChange(
                        "preferredTopics",
                        e.target.value.split(",").map((v) => v.trim())
                      )
                    }
                    style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-sm mb-1 block" style={{ color: palette.text2 }}>
                  Weak Areas
                </label>
                <Input
                  value={(editData.learningPreferences?.weakAreas || []).join(", ")}
                  onChange={(e) =>
                    handlePreferenceChange(
                      "weakAreas",
                      e.target.value.split(",").map((v) => v.trim())
                    )
                  }
                  style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <div className="flex justify-center pb-4 sm:pb-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 mt-4 flex items-center gap-2"
            style={
              saving
                ? { background: palette.border, color: palette.text2, cursor: 'not-allowed' }
                : { background: palette.accentDeep, color: palette.card }
            }
            onMouseEnter={(e) => {
              if (!saving) e.currentTarget.style.background = palette.accent;
            }}
            onMouseLeave={(e) => {
              if (!saving) e.currentTarget.style.background = palette.accentDeep;
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {message && (
          <p className="text-center pb-4" style={{ color: "#10B981" }}>{message}</p>
        )}
      </Card>
    </div>
  );
};

export default UserProfile;
