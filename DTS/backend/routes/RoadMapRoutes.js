import express from "express";
import {
  createRoadmap,
  getAllRoadmaps,
  getRoadmapById,
  updateRoadmap,
  deleteRoadmap,
  createRoadmapWithAI
} from "../Controllers/RoadMapController.js";

const router = express.Router();

router.post("/create", createRoadmap);
router.get("/", getAllRoadmaps);
router.get("/:id", getRoadmapById);
router.post("/id", updateRoadmap);
router.post("/delete", deleteRoadmap);
router.post("/createwithai",createRoadmapWithAI)

export default router;
