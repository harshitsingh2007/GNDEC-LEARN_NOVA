import mongoose from "mongoose";

const SubtopicSchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const TopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subtopics: [SubtopicSchema]
});

const ModuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: [TopicSchema]
});

const RoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true },
  modules: [ModuleSchema]
}, { timestamps: true });

export default mongoose.model("Roadmap", RoadmapSchema);
