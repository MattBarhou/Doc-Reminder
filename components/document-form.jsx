"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function DocumentForm() {
  const [documentType, setDocumentType] = useState("passport");
  const [customType, setCustomType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError("You must be logged in to add documents");
      return;
    }

    if (!expiryDate) {
      setError("Please select an expiry date");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const documentName = documentType === "other" ? customType : 
        documentType.charAt(0).toUpperCase() + documentType.slice(1);

      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            user_id: user.id,
            type: documentType,
            name: documentName,
            expiry_date: expiryDate,
          },
        ]);

      if (error) throw error;

      // Reset form
      setDocumentType("passport");
      setCustomType("");
      setExpiryDate("");
      setSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);

    } catch (error) {
      console.error("Error adding document:", error);
      setError("Failed to add document. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-(--radius) shadow-lg p-6 mb-8 border border-border animate-slide-up">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <FaPlus className="w-6 h-6 text-primary" />
        Add New Document
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          Document added successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Document Type
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="passport">Passport</option>
              <option value="healthcard">Health Card</option>
              <option value="license">Driver's License</option>
              <option value="insurance">Insurance</option>
              <option value="visa">Visa</option>
              <option value="other">Other</option>
            </select>
          </div>

          {documentType === "other" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Custom Document Name
              </label>
              <input
                type="text"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g., Work Permit"
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="mt-6 w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {loading ? "Adding..." : "Add Document"}
        </button>
      </form>
    </div>
  );
}
