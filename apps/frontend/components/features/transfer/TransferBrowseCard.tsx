"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  MapPin,
  BookOpen,
  GraduationCap,
  Calendar,
  Hash,
  User,
  CheckCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getDisplayName } from "@/lib/utils/display";

interface TransferBrowseCardProps {
  request: {
    id: string;
    uniqueId: string; // TR-YYYY-#####
    fromZone: string;
    toZones: string[];
    subject: string;
    medium: string;
    level: string;
    verified?: boolean;
    createdAt: string;
    status?: string;
    requester?: {
      firstName: string;
      subject: string;
      level: string;
    };
  };
  matchScore?: number; // 0-100 for matched transfers
  onViewDetails: (id: string) => void;
}

export default function TransferBrowseCard({
  request,
  matchScore,
  onViewDetails,
}: TransferBrowseCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "VERIFIED":
        return "bg-blue-100 text-blue-800";
      case "MATCHED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      case "CANCELLED":
        return "bg-muted text-foreground";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 border-green-600";
    if (score >= 50) return "text-blue-600 border-blue-600";
    if (score >= 30) return "text-orange-600 border-orange-600";
    return "text-gray-600 border-gray-600";
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        {/* Header with Request ID and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm font-semibold">
              {request.uniqueId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {request.verified && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
            {request.status && (
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
            )}
            {matchScore !== undefined && (
              <Badge
                variant="outline"
                className={getMatchScoreColor(matchScore)}
              >
                {matchScore}% Match
              </Badge>
            )}
          </div>
        </div>

        {/* Teacher Info (Limited) */}
        {request.requester && (
          <div className="flex items-center gap-2 text-sm bg-muted p-3 rounded-md">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {request.requester.firstName}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {getDisplayName(request.subject)}
            </span>
          </div>
        )}

        {/* Transfer Route */}
        <div className="space-y-3">
          {/* From Zone */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">From</p>
              <p className="text-sm font-semibold">{request.fromZone}</p>
            </div>
          </div>

          {/* Arrow Divider */}
          <div className="flex items-center justify-center">
            <div className="w-full border-t border-dashed border-border"></div>
            <span className="px-2 text-muted-foreground text-sm">→</span>
            <div className="w-full border-t border-dashed border-border"></div>
          </div>

          {/* To Zones */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">
                To (Preferred)
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {request.toZones.map((zone, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {zone}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Teaching Details */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{getDisplayName(request.subject)}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="font-medium">Medium:</span>
            <span>{getDisplayName(request.medium)}</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <GraduationCap className="h-3.5 w-3.5" />
            <span>{request.level}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {formatDistanceToNow(new Date(request.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(request.id)}
          >
            <Eye className="h-4 w-4 mr-1.5" />
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
