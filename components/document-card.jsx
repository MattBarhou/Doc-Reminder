"use client";

import DocumentIcon from "./document-icon";
import { FaTrash } from "react-icons/fa";

export default function DocumentCard({ document, index, onDelete }) {
  const getUrgencyColor = (daysLeft) => {
    if (daysLeft <= 7) return "text-danger";
    if (daysLeft <= 30) return "text-warning";
    return "text-success";
  };

  const getUrgencyBg = (daysLeft) => {
    if (daysLeft <= 7) return "bg-red-50 border-red-200";
    if (daysLeft <= 30) return "bg-amber-50 border-amber-200";
    return "bg-emerald-50 border-emerald-200";
  };

  return (
    <div
      className={`${getUrgencyBg(
        document.daysLeft
      )} rounded-(--radius) p-6 border-2 transition-all hover:shadow-lg hover:scale-[1.02] animate-slide-up`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div
            className={`${getUrgencyColor(
              document.daysLeft
            )} p-3 rounded-lg bg-white/50`}
          >
            <DocumentIcon type={document.type} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              {document.name}
            </h3>
            <p className="text-muted-foreground text-sm mb-3">
              Expires:{" "}
              {new Date(document.expiryDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="flex items-center gap-2">
              <div
                className={`${getUrgencyColor(
                  document.daysLeft
                )} font-bold text-3xl animate-pulse-slow`}
              >
                {document.daysLeft}
              </div>
              <div className="text-muted-foreground">
                <div className="text-sm font-medium">days left</div>
                <div className="text-xs">until expiry</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => onDelete && onDelete(document.id)}
          className="text-muted-foreground hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-white/50"
          title="Delete document"
        >
          <FaTrash className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
