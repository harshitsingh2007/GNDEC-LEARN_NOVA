import express from "express";
import { createBattle, evaluateBattle, getAllBattles, getBattleAnalysis, getUserBattleHistory, joinBattle } from "../Controllers/BattleController.js";
// import { createBattle, joinBattle } from "../controllers/battleController.js";


const router = express.Router();
router.post("/create", createBattle);
router.post("/evaluate",evaluateBattle)
router.post("/join", joinBattle);
router.get("/battlehist",getUserBattleHistory)
router.get("/all", getAllBattles);  
router.post("/analysis", getBattleAnalysis);

export default router;
