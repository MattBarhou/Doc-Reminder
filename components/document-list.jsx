"use client";

import { useState, useEffect } from "react";
import DocumentCard from "./document-card";
import { FaClipboardList, FaFileAlt } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  // Calculate days left until expiry
  const calculateDaysLeft = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Fetch documents from Supabase
  const fetchDocuments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("expiry_date", { ascending: true });

      if (error) throw error;

      // Add calculated daysLeft to each document
      const documentsWithDaysLeft = data.map((doc) => ({
        ...doc,
        daysLeft: calculateDaysLeft(doc.expiry_date),
        expiryDate: doc.expiry_date, // Keep original format for compatibility
      }));

      setDocuments(documentsWithDaysLeft);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const deleteDocument = async (documentId) => {
    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      // Remove from local state
      setDocuments(documents.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel("documents_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchDocuments(); // Refetch when changes occur
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
          <FaClipboardList className="w-6 h-6 text-primary" />
          Your Documents
        </h2>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
        <FaClipboardList className="w-6 h-6 text-primary" />
        Your Documents
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {documents.map((doc, index) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          index={index}
          onDelete={deleteDocument}
        />
      ))}

      {documents.length === 0 && !loading && (
        <div className="text-center py-16 animate-fade-in">
          <div className="text-muted-foreground mb-4">
            <FaFileAlt className="w-24 h-24 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No documents yet
          </h3>
          <p className="text-muted-foreground">
            Add your first document to start tracking expiry dates
          </p>
        </div>
      )}
    </div>
  );
}
