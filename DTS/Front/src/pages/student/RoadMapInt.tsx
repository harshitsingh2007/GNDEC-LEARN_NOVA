import React, { useState } from "react";
import { Link } from "react-router-dom";
import AllRoadMaps from "./AllRoadMaps";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import BackButton from "@/components/BackButton";
import { palette } from "@/theme/palette";

export default function RoadMapInt() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(false);

  const handleAI = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        "http://localhost:5000/api/roadmap/createwithai",
        { topic, level },
        {
          withCredentials: true,
        }
      );

      alert("AI Roadmap Created Successfully!");
      setReload(!reload);
      setTopic("");
      setLevel("");
    } catch (err) {
      console.error(err);
      alert("AI Roadmap generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: palette.bg }}>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        <div className="mb-4 sm:mb-6">
          <BackButton to="/student/courses" label="Back to Courses" />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: palette.text }}>Roadmaps</h1>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            {/* Create Roadmap Button */}
            <Link
              to="/student/createroadmap"
              className="px-4 py-2 rounded-md shadow-lg transition-all text-center"
              style={{ background: palette.accentDeep, color: palette.card }}
              onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
              onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
            >
              Create Roadmap
            </Link>

            {/* AI Create Button */}
            <Dialog>
              <DialogTrigger>
                <Button className="shadow-lg w-full sm:w-auto" style={{ background: palette.accentDeep, color: palette.card }} onMouseEnter={(e) => e.currentTarget.style.background = palette.accent} onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}>
                  Create With AI
                </Button>
              </DialogTrigger>

              <DialogContent style={{ background: palette.card, border: `1px solid ${palette.border}`, color: palette.text }}>
                <DialogHeader>
                  <DialogTitle style={{ color: palette.text }}>Create Roadmap With AI</DialogTitle>
                </DialogHeader>

                {/* AI form */}
                <form onSubmit={handleAI} className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm" style={{ color: palette.text2 }}>Topic *</label>
                    <Input
                      className="mt-1 text-sm"
                      style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                      placeholder="Enter topic e.g. MERN, DSA, ML..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm" style={{ color: palette.text2 }}>Level *</label>
                    <Input
                      className="mt-1 text-sm"
                      style={{ background: palette.card, color: palette.text, borderColor: palette.border }}
                      placeholder="Beginner / Intermediate / Advanced"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full shadow-lg"
                    style={{ background: palette.accentDeep, color: palette.card }}
                    onMouseEnter={(e) => e.currentTarget.style.background = palette.accent}
                    onMouseLeave={(e) => e.currentTarget.style.background = palette.accentDeep}
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate Roadmap"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* All Roadmaps Section */}
        <AllRoadMaps key={reload} />
      </div>
    </div>
  );
}
