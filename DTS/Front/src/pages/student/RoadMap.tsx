import React, { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function CreateRoadmap() {
  const [title, setTitle] = useState("");
  const [modules, setModules] = useState([{ name: "", topics: [{ name: "" }] }]);

  const handleModuleChange = (index, value) => {
    const newModules = [...modules];
    newModules[index].name = value;
    setModules(newModules);
  };

  const handleTopicChange = (moduleIndex, topicIndex, value) => {
    const newModules = [...modules];
    newModules[moduleIndex].topics[topicIndex].name = value;
    setModules(newModules);
  };

  const addModule = () => {
    setModules([...modules, { name: "", topics: [{ name: "" }] }]);
  };

  const removeModule = (moduleIndex) => {
    const newModules = modules.filter((_, i) => i !== moduleIndex);
    setModules(newModules);
  };

  const addTopic = (moduleIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].topics.push({ name: "" });
    setModules(newModules);
  };

  const removeTopic = (moduleIndex, topicIndex) => {
    const newModules = [...modules];
    newModules[moduleIndex].topics = newModules[moduleIndex].topics.filter((_, i) => i !== topicIndex);
    setModules(newModules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token") || document.cookie.replace("jwt=", "");

      await axios.post(
        "http://localhost:5000/api/roadmap/create",
        { title, modules },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      alert("Roadmap created successfully!");

      setTitle("");
      setModules([{ name: "", topics: [{ name: "" }] }]);
    } catch (error) {
      alert(error.response?.data?.message || "Error creating roadmap");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-10">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <BackButton to="/student/roadmap" label="Back to Roadmaps" />
        </div>
        <Card className="w-full bg-white text-black shadow-xl border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-black">Create Roadmap</CardTitle>
          </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm text-gray-700">Roadmap Title</label>
              <Input
                className="bg-white border-gray-300 text-black mt-1 focus:border-black focus:ring-black/20"
                placeholder="Enter roadmap title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Modules */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Modules</h3>

              {modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Input
                      className="bg-white border-gray-300 text-black focus:border-black focus:ring-black/20"
                      placeholder={`Module ${moduleIndex + 1} Name`}
                      value={module.name}
                      onChange={(e) => handleModuleChange(moduleIndex, e.target.value)}
                      required
                    />
                    {modules.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeModule(moduleIndex)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Topics */}
                  <div className="mt-4 space-y-3">
                    <h4 className="text-md font-medium text-black">Topics</h4>

                    {module.topics.map((topic, topicIndex) => (
                      <div key={topicIndex} className="flex items-center gap-2">
                        <Input
                          className="bg-white border-gray-300 text-black focus:border-black focus:ring-black/20"
                          placeholder={`Topic ${topicIndex + 1}`}
                          value={topic.name}
                          onChange={(e) => handleTopicChange(moduleIndex, topicIndex, e.target.value)}
                          required
                        />
                        {module.topics.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => removeTopic(moduleIndex, topicIndex)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}

                    <Button
                      type="button"
                      className="mt-2 bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
                      onClick={() => addTopic(moduleIndex)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Topic
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                className="w-full bg-gray-100 hover:bg-gray-200 text-black border border-gray-300"
                onClick={addModule}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Module
              </Button>
            </div>

            <Button type="submit" className="w-full bg-black hover:bg-gray-800 text-white py-2 shadow-lg shadow-black/20 hover:shadow-black/30">
              Create Roadmap
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}