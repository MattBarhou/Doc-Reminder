"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import {
  FaClock,
  FaFileAlt,
  FaCalendarAlt,
  FaBell,
  FaShieldAlt,
  FaPassport,
  FaIdCard,
  FaHeart,
} from "react-icons/fa";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const floatingIcons = [
    { Icon: FaClock, delay: "0s", duration: "6s" },
    { Icon: FaFileAlt, delay: "1s", duration: "8s" },
    { Icon: FaCalendarAlt, delay: "2s", duration: "7s" },
    { Icon: FaBell, delay: "0.5s", duration: "9s" },
    { Icon: FaShieldAlt, delay: "1.5s", duration: "6.5s" },
    { Icon: FaPassport, delay: "2.5s", duration: "7.5s" },
    { Icon: FaIdCard, delay: "3s", duration: "8.5s" },
    { Icon: FaHeart, delay: "3.5s", duration: "6s" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 auth-gradient-bg">
        <div className="absolute inset-0 auth-gradient-overlay-1 animate-pulse"></div>
        <div className="absolute inset-0 auth-radial-overlay animate-pulse"></div>
      </div>

      {/* Animated Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 auth-orb-1 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 auth-orb-2 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 auth-orb-3 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Floating Icons */}
      {floatingIcons.map(({ Icon, delay, duration }, index) => (
        <div
          key={index}
          className="absolute text-white/10 animate-float"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
            animationDelay: delay,
            animationDuration: duration,
            fontSize: `${Math.random() * 20 + 20}px`,
          }}
        >
          <Icon />
        </div>
      ))}

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 auth-grid-pattern"></div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 glass-card mb-4">
              <FaClock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">DocReminder</h1>
            <p className="text-white/70 text-lg">
              Never miss an expiry date again
            </p>
          </div>

          {/* Auth Forms */}
          {isLogin ? (
            <LoginForm onToggleMode={() => setIsLogin(false)} />
          ) : (
            <SignUpForm onToggleMode={() => setIsLogin(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
