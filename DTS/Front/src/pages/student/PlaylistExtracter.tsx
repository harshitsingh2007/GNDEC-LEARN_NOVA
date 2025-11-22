import React, { useState } from "react";
import axios from "axios";
import { Youtube, Layers, FileText, Library, GraduationCap } from "lucide-react";
import BackButton from "@/components/BackButton";
import { palette } from "@/theme/palette";

const CreateCourseFromPlaylist = () => {
  const [formData, setFormData] = useState({
    playlistUrl: "",
    title: "",
    description: "",
    category: "Programming",
    level: "Beginner",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/courses/ytcr",
        formData,
        { withCredentials: true }
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("Please log in again to import a playlist course.");
      } else {
        setError(
          err.response?.data?.error || "Failed to create course from playlist."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8 sm:py-12 px-4" style={{ background: palette.bg }}>
      {/* Header */}
      <div className="w-full max-w-lg mb-6">
        <BackButton to="/student/courses" label="Back to Courses" />
      </div>
      <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Youtube className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: palette.text }} />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: palette.text }}>
            Create Course from Playlist
          </h1>
        </div>
        <p className="max-w-xl text-sm sm:text-base" style={{ color: palette.text2 }}>
          Generate a structured course automatically from any public YouTube
          playlist.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-lg space-y-6"
        style={{ background: palette.card, border: `1px solid ${palette.border}` }}
      >
        {/* Playlist URL */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: palette.text2 }}>
            <Youtube className="w-4 h-4" style={{ color: palette.text }} /> Playlist URL *
          </label>
          <input
            type="text"
            name="playlistUrl"
            placeholder="https://www.youtube.com/playlist?list=..."
            value={formData.playlistUrl}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm"
            style={{ background: palette.card, color: palette.text, borderColor: palette.border, '--tw-ring-color': palette.accent } as React.CSSProperties}
          />
        </div>

        {/* Title */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: palette.text2 }}>
            <Layers className="w-4 h-4" style={{ color: palette.text }} /> Course Title
          </label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Mastering React with YouTube"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm"
            style={{ background: palette.card, color: palette.text, borderColor: palette.border, '--tw-ring-color': palette.accent } as React.CSSProperties}
          />
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: palette.text2 }}>
            <FileText className="w-4 h-4" style={{ color: palette.text }} /> Description
          </label>
          <textarea
            name="description"
            rows={3}
            placeholder="Briefly describe the course..."
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm"
            style={{ background: palette.card, color: palette.text, borderColor: palette.border, '--tw-ring-color': palette.accent } as React.CSSProperties}
          ></textarea>
        </div>

        {/* Category & Level */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: palette.text2 }}>
              <Library className="w-4 h-4" style={{ color: palette.text }} /> Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm"
              style={{ background: palette.card, color: palette.text, borderColor: palette.border, '--tw-ring-color': palette.accent } as React.CSSProperties}
            />
          </div>

          <div className="flex-1">
            <label className="flex items-center gap-2 mb-2 text-sm font-medium" style={{ color: palette.text2 }}>
              <GraduationCap className="w-4 h-4" style={{ color: palette.text }} /> Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 text-sm"
              style={{ background: palette.card, color: palette.text, borderColor: palette.border, '--tw-ring-color': palette.accent } as React.CSSProperties}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 mt-2 rounded-lg font-semibold transition shadow-lg"
          style={
            loading
              ? { background: palette.border, color: palette.text2, cursor: 'not-allowed' }
              : { background: palette.accentDeep, color: palette.card }
          }
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = palette.accent;
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = palette.accentDeep;
          }}
        >
          {loading ? "Creating Course..." : "Generate Course"}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-8 sm:mt-10 w-full max-w-2xl p-6 rounded-2xl shadow-lg" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: palette.text }}>
            <Layers className="w-5 h-5" /> Course Created Successfully
          </h2>
          <div className="space-y-2" style={{ color: palette.text2 }}>
            <p>
              <strong style={{ color: palette.text }}>Title:</strong> {result.course.title}
            </p>
            <p>
              <strong style={{ color: palette.text }}>Modules:</strong> {result.totalModules}
            </p>
            <p>
              <strong style={{ color: palette.text }}>Total Videos:</strong> {result.totalVideos}
            </p>
            <p className="text-sm pt-2" style={{ color: palette.text2 }}>
              Course ID:{" "}
              <span style={{ color: palette.text }}>{result.course._id}</span>
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-6 font-medium text-sm" style={{ color: "#EF4444" }}>{error}</p>
      )}
    </div>
  );
};

export default CreateCourseFromPlaylist;
