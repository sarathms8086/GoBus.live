"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Navigation, Search, QrCode, ArrowRight, History, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalMenu } from "@/components/global-menu";
import { motion } from "framer-motion";

export default function Home() {
  const [currentLocation, setCurrentLocation] = useState("Locating...");
  const [isLocating, setIsLocating] = useState(true);

  useEffect(() => {
    // Simulate fetching location
    setTimeout(() => {
      setCurrentLocation("Koramangala, Bangalore");
      setIsLocating(false);
    }, 2000);
  }, []);

  const recentSearches = [
    { from: "Home", to: "Office", time: "9:00 AM" },
    { from: "Gym", to: "Market", time: "6:30 PM" },
  ];

  return (
    <main className="min-h-screen bg-[#F4F7F5] relative overflow-hidden flex flex-col">
      {/* Abstract Map Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient Blobs */}
      <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[60%] bg-brand-green/10 rounded-full blur-[100px]" />
      <div className="absolute top-[20%] -left-[20%] w-[60%] h-[60%] bg-brand-blue/10 rounded-full blur-[100px]" />

      {/* Header */}
      <header className="flex justify-between items-center p-6 relative">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center shadow-lg shadow-brand-green/20 mr-3">
            <Navigation className="w-6 h-6 text-white transform -rotate-45" />
          </div>
          <span className="text-2xl font-bold text-brand-slate tracking-tight">GO BUS</span>
        </div>
        <GlobalMenu />
      </header>

      {/* Hero Section */}
      <div className="px-6 mb-6 relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-brand-slate mb-2 leading-tight"
        >
          Where to <br />
          <span className="text-brand-green">next?</span>
        </motion.h1>
      </div>

      {/* Search Card (Glassmorphism) */}
      <div className="px-6 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl shadow-brand-slate/5 border border-white/50"
        >
          {/* From (Current Location) */}
          <div className="relative mb-4 group">
            <label className="text-[10px] font-bold text-brand-grey uppercase tracking-wider mb-1 block ml-4">From</label>
            <div className="flex items-center bg-white/50 border border-white/50 rounded-2xl p-4 transition-all group-hover:bg-white group-hover:shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-3 shrink-0">
                <MapPin className="w-5 h-5 text-brand-blue" />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={currentLocation}
                  readOnly
                  className="w-full bg-transparent font-bold text-brand-slate focus:outline-none cursor-default text-lg"
                />
              </div>
              {isLocating && (
                <div className="w-5 h-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            {/* Connector Line */}
            <div className="absolute left-[39px] top-[70px] w-[2px] h-8 bg-gradient-to-b from-blue-200 to-green-200" />
          </div>

          {/* To (Destination) */}
          <div className="mb-8 group">
            <label className="text-[10px] font-bold text-brand-grey uppercase tracking-wider mb-1 block ml-4">To</label>
            <div className="flex items-center bg-white/50 border border-white/50 rounded-2xl p-4 transition-all group-hover:bg-white group-hover:shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mr-3 shrink-0">
                <MapPin className="w-5 h-5 text-brand-green" />
              </div>
              <input
                type="text"
                placeholder="Search Destination"
                className="w-full bg-transparent font-bold text-brand-slate placeholder:text-gray-400 focus:outline-none text-lg"
              />
            </div>
          </div>

          {/* Search Button */}
          <Link href="/customer">
            <Button className="w-full py-7 text-lg bg-brand-green hover:bg-green-700 shadow-xl shadow-brand-green/30 rounded-2xl group transition-all hover:scale-[1.02]">
              Search Buses
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Recent Searches */}
      <div className="px-6 mt-8 relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-brand-grey uppercase tracking-wider">Recent</h3>
          <button className="text-xs font-bold text-brand-blue">Clear</button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {recentSearches.map((search, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + (i * 0.1) }}
              className="flex-shrink-0 bg-white p-3 pr-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center">
                <History className="w-4 h-4 text-brand-grey" />
              </div>
              <div>
                <p className="font-bold text-sm text-brand-slate">{search.from} → {search.to}</p>
                <p className="text-[10px] text-brand-grey">{search.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mt-auto mb-8 relative">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/customer/scan">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex items-center justify-center gap-3 h-20"
            >
              <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center">
                <QrCode className="w-5 h-5 text-brand-green" />
              </div>
              <span className="font-bold text-brand-slate text-sm">Scan QR</span>
            </motion.div>
          </Link>

          <Link href="/customer/tickets">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/50 flex items-center justify-center gap-3 h-20"
            >
              <div className="w-10 h-10 bg-brand-blue/10 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5 text-brand-blue" />
              </div>
              <span className="font-bold text-brand-slate text-sm">My Trips</span>
            </motion.div>
          </Link>
        </div>
      </div>
    </main>
  );
}
