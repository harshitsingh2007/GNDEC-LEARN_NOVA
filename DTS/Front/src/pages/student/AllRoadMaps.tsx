import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { palette } from "@/theme/palette";

export default function AllRoadMaps() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/roadmap", {
          withCredentials: true,
        });
        setRoadmaps(res.data.roadmaps);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: palette.bg, color: palette.text }}>
        Loading Roadmaps...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-10" style={{ background: palette.bg, color: palette.text }}>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center" style={{ color: palette.text }}>All Roadmaps</h1>

      {roadmaps.length === 0 ? (
        <p className="text-center" style={{ color: palette.text2 }}>No roadmaps found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {roadmaps.map((r) => (
            <Card
              key={r._id}
              className="transition cursor-pointer hover:shadow-lg"
              style={{ background: palette.card, border: `1px solid ${palette.border}` }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = palette.accent;
                e.currentTarget.style.backgroundColor = palette.cardHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = palette.border;
                e.currentTarget.style.backgroundColor = palette.card;
              }}
              onClick={() => navigate("/student/viewroadmap", { state: r._id })}
            >
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl" style={{ color: palette.text }}>{r.title}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm mb-1" style={{ color: palette.text2 }}>
                  Modules: {r.modules.length}
                </p>
                <p className="text-sm" style={{ color: palette.text2 }}>
                  Created: {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
