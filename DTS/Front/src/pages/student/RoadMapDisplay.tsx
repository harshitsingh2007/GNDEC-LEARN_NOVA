import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { palette } from "@/theme/palette";

export default function RoadMapDisplay() {
  const { state } = useLocation(); // state = roadmapId
  const roadmapId = state;
  
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/roadmap/${roadmapId}`, {
          withCredentials: true,
        });
        setRoadmap(res.data.roadmap);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [roadmapId]);

  if (loading) return <div className="text-center mt-10" style={{ color: palette.text }}>Loading roadmap...</div>;

  if (!roadmap) return <div className="text-center mt-10" style={{ color: palette.text }}>Roadmap not found.</div>;

  return (
    <div className="min-h-screen p-6 sm:p-10 flex justify-center" style={{ background: palette.bg }}>
      <Card className="max-w-4xl w-full shadow-xl p-4 sm:p-6" style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
        <CardContent>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10" style={{ color: palette.text }}>{roadmap.title}</h1>

          {/* Vertical connected roadmap */}
          <div className="relative">

            <div className="absolute left-5 top-0 bottom-0 w-1" style={{ background: palette.border }}></div>

            {roadmap.modules.map((module, mIndex) => (
              <div key={mIndex} className="relative mb-8 sm:mb-10 pl-12">
                
                {/* Dot */}
                <div className="absolute left-3.5 w-4 h-4 rounded-full" style={{ background: palette.accent }}></div>

                {/* Module Title */}
                <h2 className="text-lg sm:text-xl font-semibold mb-4" style={{ color: palette.text }}>{module.name}</h2>

                {/* Topics */}
                <div className="ml-4 pl-6" style={{ borderLeft: `1px solid ${palette.border}` }}>
                  {module.topics.map((topic, tIndex) => (
                    <div key={tIndex} className="mb-3 flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3" style={{ background: palette.accentDeep }}></div>
                      <p className="text-sm sm:text-base" style={{ color: palette.text2 }}>{topic.name}</p>
                    </div>
                  ))}
                </div>

              </div>
            ))}

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
