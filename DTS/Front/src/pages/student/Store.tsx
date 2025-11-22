import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Gift, Coins, RefreshCw, Star, MapPin, Package, 
  Truck, CheckCircle, Clock, BadgeCheck 
} from "lucide-react";
import { palette } from "@/theme/palette";
import { useToast } from "@/components/ui/use-toast";

// Tracking stages
const trackingSteps = [
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const StorePage = () => {

  const [items, setItems] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [redeeming, setRedeeming] = useState<string | null>(null);

  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any>(null);

  const { toast } = useToast();

  // Address form
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: ""
  });

  // Fetch Items
  const fetchStore = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/store", {
        withCredentials: true,
      });
      setItems(data.items);
      setXp(data.userXP);
    } catch (err) {
      console.error("Store fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Redemptions
  const fetchRedemptions = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:5000/api/store/redemptions",
        { withCredentials: true }
      );

      setRedemptions(data.redemptions || []);

    } catch (err) {
      console.error("Redemptions fetch error:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Redeem flow: ALWAYS ask address first
  const handleRedeem = (item: any) => {
    setSelectedItem(item);
    setShowAddressDialog(true);
  };

  // Process redemption after address
  const processRedeem = async (itemId: string, shippingAddress: any) => {
    try {
      setRedeeming(itemId);
      
      const { data } = await axios.post(
        "http://localhost:5000/api/store/redeem",
        { itemId, shippingAddress },
        { withCredentials: true }
      );

      setShowAddressDialog(false);
      setShowSuccess(true);
      setTrackingInfo(data.trackingInfo);
      setXp(data.remainingXP);

      toast({
        title: "🎉 Redeemed Successfully!",
        description: `You redeemed ${selectedItem?.name}`,
      });

      fetchStore();
      fetchRedemptions();

    } catch (err: any) {
      toast({
        title: "Redemption Failed",
        description: err.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setRedeeming(null);
    }
  };

  // Submit address
  const handleAddressSubmit = () => {
    if (!address.fullName || !address.street || !address.city || !address.zipCode) {
      toast({
        title: "Missing Information",
        description: "Please enter all required fields.",
        variant: "destructive"
      });
      return;
    }

    processRedeem(selectedItem._id, address);
  };

  useEffect(() => {
    fetchStore();
    fetchRedemptions();
  }, []);

  // Auto-progress tracking statuses
  const autoUpdateStatus = (r: any) => {
    const created = new Date(r.createdAt);
    const now = new Date();
    const diff = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    let stage = 0;

    if (diff >= 1) stage = 1;
    if (diff >= 2) stage = 2;
    if (diff >= 3) stage = 3;

    return trackingSteps[stage];
  };

  if (loading)
    return (
      <div className="h-[80vh] flex justify-center items-center" style={{ color: palette.text2 }}>
        Loading store...
      </div>
    );

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 flex flex-col items-center" style={{ background: palette.bg, color: palette.text }}>

      {/* HEADER */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl text-center mb-8 sm:mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold flex justify-center items-center gap-3 tracking-tight">
          <Gift className="w-6 h-6 sm:w-8 sm:h-8" /> Nova XP Store
        </h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: palette.text2 }}>
          Redeem your XP for exclusive rewards.
        </p>
      </motion.div>

      {/* XP BAR */}
      <div className="w-full max-w-5xl rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-8 py-4 mb-8"
        style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
        <div className="flex items-center gap-3 text-lg">
          <Coins className="w-5 h-5" />
          <span style={{ color: palette.text2 }}>Your XP:</span>
          <span className="font-extrabold">{xp}</span>
        </div>
        <Button onClick={fetchStore} style={{ background: palette.accentDeep, color: palette.card }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* STORE GRID */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-16">
        {items.map((item, index) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            
            <Card className="rounded-xl overflow-hidden hover:shadow-lg transition-all"
              style={{ background: palette.card, border: `1px solid ${palette.border}` }}>

              <CardHeader className="p-0 relative">
                <img src={item.image} className="w-full h-44 object-cover" />
                <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-2 py-1 rounded">
                  {item.category}
                </span>
              </CardHeader>

              <CardContent className="p-4 space-y-2">
                <CardTitle className="text-base font-semibold truncate">{item.name}</CardTitle>
                <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>

                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-sm flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {item.cost} XP
                  </span>

                  <Button size="sm" onClick={() => handleRedeem(item)}
                    style={{ background: palette.accentDeep, color: palette.card }}>
                    Redeem
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* --------------------------------------- */}
      {/* MY ORDERS — NEW SECTION */}
      {/* --------------------------------------- */}

      <div className="w-full max-w-6xl mb-10">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-5">
          <Package className="w-6 h-6" /> My Orders
        </h2>

        {loadingOrders ? (
          <p>Loading orders...</p>
        ) : redemptions.length === 0 ? (
          <p style={{ color: palette.text2 }}>You haven't redeemed anything yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {redemptions.map((r) => {
              const status = autoUpdateStatus(r);
              const stepIndex = trackingSteps.indexOf(status);

              return (
                <Card key={r._id} style={{ background: palette.card, border: `1px solid ${palette.border}` }}>
                  <CardContent className="p-4">

                    <div className="flex gap-4">
                      <img src={r.item.image} className="w-24 h-24 object-cover rounded" />
                      <div>
                        <h3 className="font-bold">{r.item.name}</h3>
                        <p className="text-xs text-gray-500">
                          Redeemed on {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Tracking Column */}
                    <div className="mt-4">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Status: 
                        <span className="text-blue-600">{status}</span>
                      </p>

                      <p className="text-xs mt-1 text-gray-500">
                        Tracking ID: {r.trackingInfo?.trackingId}
                      </p>

                      <div className="mt-3">
                        {trackingSteps.map((step, i) => (
                          <div key={i} className="flex items-center gap-2 mb-2">
                            {i <= stepIndex ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={i <= stepIndex ? "text-green-600" : "text-gray-500"}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* --------------------------------------- */}
      {/* ADDRESS DIALOG */}
      {/* --------------------------------------- */}

      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shipping Address</DialogTitle>
            <DialogDescription>
              Provide address for <strong>{selectedItem?.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {Object.keys(address).map((field) => (
              <div key={field}>
                <Label>{field}</Label>
                <Input
                  value={(address as any)[field]}
                  onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddressSubmit}>
              {redeeming ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSuccess(false)}>

            <motion.div className="bg-white rounded-xl p-8 max-w-md text-center"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}>

              <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />

              <h3 className="text-xl font-bold mb-2">
                🎉 Redemption Successful!
              </h3>

              {trackingInfo && (
                <p className="text-sm mb-4">
                  Tracking ID: <strong>{trackingInfo.trackingId}</strong>
                </p>
              )}

              <Button onClick={() => setShowSuccess(false)} className="w-full">
                Continue
              </Button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StorePage;
