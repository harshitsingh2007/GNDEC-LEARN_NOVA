import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { palette } from "@/theme/palette";

const API_URL = "http://localhost:5000/api/battle";

const BattleSetup = () => {
  // Form states
  const [battleName, setBattleName] = useState("");
  const [tags, setTags] = useState("");
  const [battleCode, setBattleCode] = useState("");
  const [createdBattle, setCreatedBattle] = useState(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  // Recent battles
  const [recentBattles, setRecentBattles] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const navigate = useNavigate();

  // Animation refs
  const leftSword = useRef(null);
  const rightSword = useRef(null);
  const introContainer = useRef(null);
  const novaTextRef = useRef(null);

  // axios instance for reuse
  const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
  });

  // —————— NOVA + SWORDS Animation (per-letter) ——————
  useEffect(() => {
    if (!introContainer.current) return;

    // safety: ensure novaTextRef exists
    if (novaTextRef.current) {
      const text = "N O V A   B A T T L E   A R E N A";
      novaTextRef.current.innerHTML = text
        .split("")
        .map((char) =>
          char === " "
            ? `<span class="inline-block w-2"></span>`
            : `<span class="inline-block opacity-0 translate-y-4">${char}</span>`
        )
        .join("");
    }

    const letters =
      novaTextRef.current?.querySelectorAll("span") ?? [];

    gsap.set(introContainer.current, { opacity: 1 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      leftSword.current,
      { x: "-180%", rotate: -70, opacity: 0 },
      { x: "-10%", rotate: -30, opacity: 1, duration: 0.8 }
    )
      .fromTo(
        rightSword.current,
        { x: "180%", rotate: 70, opacity: 0 },
        { x: "10%", rotate: 30, opacity: 1, duration: 0.8 },
        "-=0.6"
      )
      // letters reveal synced slightly before collision
      .to(
        letters,
        {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.3"
      )
      // collision — 2s duration
      .to(
        [leftSword.current, rightSword.current],
        {
          x: (i) => (i === 0 ? 80 : -80),
          rotate: 0,
          scale: 2,
          duration: 2,
        },
        "+=0.2"
      )
      // small pulse on letters during collision
      .to(
        letters,
        {
          scale: 1.12,
          yoyo: true,
          repeat: 1,
          duration: 0.35,
          stagger: 0.02,
        },
        "<"
      )
      // fade out swords & letters
      .to([leftSword.current, rightSword.current], { opacity: 0, scale: 0.7, duration: 0.4 })
      .to(letters, { opacity: 0, duration: 0.25, stagger: 0.01 }, "-=0.3")
      .to(introContainer.current, { opacity: 0, duration: 0.6 }, "-=0.3");

    // cleanup on unmount
    return () => {
      tl.kill();
      gsap.killTweensOf([leftSword.current, rightSword.current, letters]);
    };
  }, []);

  // —————— Fetch recent battles ——————
  useEffect(() => {
    let mounted = true;
    const fetchRecent = async () => {
      try {
        setRecentLoading(true);
        const res = await axiosInstance.get("/all");
        if (!mounted) return;
        setRecentBattles(res.data.battles || []);
      } catch (err) {
        console.error("Failed to fetch recent battles:", err);
      } finally {
        if (mounted) setRecentLoading(false);
      }
    };
    fetchRecent();
    return () => { mounted = false; };
  }, []);

  // CREATE BATTLE
  const handleCreateBattle = async () => {
    if (!battleName || !tags) {
      toast({ description: "⚠️ Please fill all fields" });
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.post("/create", {
        battleName,
        tags: tags.split(",").map((t) => t.trim()),
      });

      setCreatedBattle(data);
      setBattleCode(data.battleCode);
      toast({ description: "🔥 Battle created successfully!" });

      // refresh recent battles quickly
      try {
        const res = await axiosInstance.get("/all");
        setRecentBattles(res.data.battles || []);
      } catch (e) {
        // ignore refresh error
      }
    } catch (err) {
      toast({
        description: err.response?.data?.message || "❌ Failed to create battle",
      });
    } finally {
      setLoading(false);
    }
  };

  // JOIN BATTLE
  const handleJoinBattle = async () => {
    if (!battleCode || !username) {
      toast({ description: "⚠️ Enter username and battle code" });
      return;
    }

    try {
      setLoading(true);

      const { data } = await axiosInstance.post("/join", { battleCode });

      toast({ description: `⚔️ Joined battle: ${data.battleName}` });

      navigate("/student/battleground", {
        state: { battleData: data, username },
      });
    } catch (err) {
      toast({
        description: err.response?.data?.message || "❌ Failed to join battle",
      });
    } finally {
      setLoading(false);
    }
  };

  // navigate to analysis page for a particular battle
  const openBattleAnalysis = (battleId) => {
    if (!battleId) {
      toast({ description: "Invalid battle selected" });
      return;
    }
    navigate("/student/battleanalysis", { state: { battleId } });
  };

  // small helper
  const safe = (v: any, d: any = "") => (v === undefined || v === null ? d : v);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: palette.bg }}
    >
      {/* INTRO OVERLAY */}
      <div
        ref={introContainer}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
        style={{ backgroundColor: palette.bg }}
      >
        <div className="flex items-center gap-8">
          <img
            ref={leftSword}
            src="/leftsword.png"
            alt="left sword"
            className="w-[200px] h-[200px] opacity-0 object-contain"
          />
          <img
            ref={rightSword}
            src="/rightsword.png"
            alt="right sword"
            className="w-[200px] h-[200px] opacity-0 object-contain"
          />
        </div>

        {/* Nova per-letter */}
        <div
          ref={novaTextRef}
          className="mt-[100px] text-4xl md:text-5xl font-extrabold text-center"
          style={{ color: palette.text }}
          aria-hidden
        />
      </div>

      {/* MAIN UI */}
      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-extrabold tracking-wide" style={{ color: palette.text }}>
            ⚔️ Battle Arena
          </h1>
          <p className="mt-3 text-lg" style={{ color: palette.text2 }}>
            Create or Join a Battle — Let the clash begin.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* CREATE BATTLE */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl shadow-lg p-6"
            style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
          >
            <Card className="bg-transparent shadow-none" style={{ backgroundColor: palette.card }}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold" style={{ color: palette.text }}>
                  Create Battle
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {!createdBattle ? (
                  <>
                    <div>
                      <Label style={{ color: palette.text2 }}>Battle Name</Label>
                      <Input
                        placeholder="Ex: JS Master Clash"
                        value={battleName}
                        onChange={(e) => setBattleName(e.target.value)}
                        className="mt-2"
                        style={{ backgroundColor: palette.card, color: palette.text, borderColor: palette.border }}
                      />
                    </div>

                    <div>
                      <Label style={{ color: palette.text2 }}>Tags (comma separated)</Label>
                      <Input
                        placeholder="JavaScript, Arrays, Logic"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="mt-2"
                        style={{ backgroundColor: palette.card, color: palette.text, borderColor: palette.border }}
                      />
                    </div>

                    <Button
                      onClick={handleCreateBattle}
                      disabled={loading}
                      className="w-full py-3 mt-2 rounded-lg shadow-lg"
                      style={{ backgroundColor: palette.accentDeep, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accentDeep}33, 0 2px 4px -2px ${palette.accentDeep}33` }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accent}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Battle"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <h3 className="text-2xl font-bold" style={{ color: palette.accentDeep }}>Battle Created!</h3>
                    <p className="mt-3" style={{ color: palette.text2 }}>
                      <span className="font-medium">Name:</span> {safe(createdBattle.battleName)}
                    </p>
                    <p className="mt-1 text-lg" style={{ color: palette.text }}>
                      <span className="font-medium">Code:</span>{" "}
                      <span className="font-bold tracking-wide" style={{ color: palette.accentDeep }}>
                        {safe(createdBattle.battleCode)}
                      </span>
                    </p>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setCreatedBattle(null);
                        setBattleCode("");
                        setBattleName("");
                        setTags("");
                      }}
                      className="mt-5"
                      style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.card }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.card}
                    >
                      Create Another
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* JOIN BATTLE */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl shadow-lg p-6"
            style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
          >
            <Card className="bg-transparent shadow-none" style={{ backgroundColor: palette.card }}>
              <CardHeader>
                <CardTitle className="text-2xl font-semibold" style={{ color: palette.text }}>
                  Join Battle
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <Label style={{ color: palette.text2 }}>Your Name</Label>
                  <Input
                    placeholder="Enter your name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-2"
                    style={{ backgroundColor: palette.card, color: palette.text, borderColor: palette.border }}
                  />
                </div>

                <div>
                  <Label style={{ color: palette.text2 }}>Battle Code</Label>
                  <Input
                    placeholder="Enter battle code"
                    value={battleCode}
                    onChange={(e) => setBattleCode(e.target.value)}
                    className="mt-2"
                    style={{ backgroundColor: palette.card, color: palette.text, borderColor: palette.border }}
                  />
                </div>

                <Button
                  onClick={handleJoinBattle}
                  disabled={loading}
                  className="w-full py-3 mt-2 rounded-lg shadow-lg"
                  style={{ backgroundColor: palette.accentDeep, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accentDeep}33, 0 2px 4px -2px ${palette.accentDeep}33` }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accent}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Join Battle"
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* RECENT BATTLES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-12 rounded-2xl p-6 shadow-sm"
          style={{ backgroundColor: palette.card, border: `1px solid ${palette.border}` }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold" style={{ color: palette.text }}>🔥 Recent Battles</h2>
            <p className="text-sm" style={{ color: palette.text2 }}>{recentLoading ? "Loading..." : `${recentBattles.length} available`}</p>
          </div>

          {recentBattles.length === 0 && !recentLoading ? (
            <p className="italic" style={{ color: palette.text2 }}>No battles available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recentBattles.map((battle) => (
                <div
                  key={battle._id}
                  className="border p-5 rounded-xl transition shadow-sm"
                  style={{ backgroundColor: palette.card, borderColor: palette.border }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.card}
                >
                  <h3 className="text-xl font-semibold" style={{ color: palette.text }}>{safe(battle.battleName, "Untitled")}</h3>
                  <p className="text-sm mt-1" style={{ color: palette.text2 }}>Code: <span className="font-semibold" style={{ color: palette.text }}>{safe(battle.battleCode)}</span></p>
                  <p className="text-sm" style={{ color: palette.text2 }}>Players: {Array.isArray(battle.players) ? battle.players.length : safe(battle.players, 0)}</p>
                  <p className="text-sm" style={{ color: palette.text2 }}>Tags: <span style={{ color: palette.text }}>{Array.isArray(battle.tags) ? battle.tags.join(", ") : safe(battle.tags)}</span></p>

                  <div className="mt-4 flex gap-3">
                    <Button
                      className="flex-1 shadow-lg"
                      style={{ backgroundColor: palette.accent, color: palette.card, boxShadow: `0 4px 6px -1px ${palette.accent}33, 0 2px 4px -2px ${palette.accent}33` }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.accentDeep}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.accent}
                      onClick={() => openBattleAnalysis(battle._id)}
                    >
                      View Analysis
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        // prefill code for quick join
                        setBattleCode(battle.battleCode || "");
                        toast({ description: "Battle code filled" });
                      }}
                      style={{ borderColor: palette.border, color: palette.text, backgroundColor: palette.card }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = palette.cardHover}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = palette.card}
                    >
                      Use Code
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BattleSetup;