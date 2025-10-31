"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { FaCheckCircle } from "react-icons/fa";

export default function SignUpForm({ onToggleMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center">
          <div className="text-green-400 mb-4">
            <FaCheckCircle className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Check Your Email
          </h2>
          <p className="text-white/70 mb-6">
            We've sent you a confirmation link. Please check your email and
            click the link to activate your account.
          </p>
          <button
            onClick={onToggleMode}
            className="text-white cursor-pointer hover:text-white/90 hover:underline font-medium transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Create Account
      </h2>

      {error && (
        <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg glass-input transition-all"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg glass-input transition-all"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/90 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg glass-input transition-all"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer px-4 py-3 rounded-lg glass-button"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-white/70 mt-6">
        Already have an account?{" "}
        <button
          onClick={onToggleMode}
          className="text-white cursor-pointer hover:text-white/90 hover:underline font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
