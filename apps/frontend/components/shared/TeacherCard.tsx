"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  GraduationCap,
  Building2,
  ArrowRight,
  Mail,
  Phone,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TeacherCardProps {
  name: string;
  id: string;
  email?: string;
  phone?: string;
  district: string;
  school: string;
  currentZone: string;
  wantZone: string;
  avatar?: string;
  subject?: string;
  level?: string;
  status?: "available" | "pending" | "matched";
  onContact?: () => void;
  onViewProfile?: () => void;
  className?: string;
}

export function TeacherCard({
  name,
  id,
  email,
  phone,
  district,
  school,
  currentZone,
  wantZone,
  avatar,
  subject = "Tamil",
  level = "Primary",
  status,
  onContact,
  onViewProfile,
  className,
}: TeacherCardProps) {
  const t = useTranslations("shared.teacherCard");

  const statusConfig = {
    available: {
      label: t("status.available"),
      className: "bg-green-100 text-green-800",
    },
    pending: {
      label: t("status.pending"),
      className: "bg-amber-100 text-amber-800",
    },
    matched: {
      label: t("status.matched"),
      className: "bg-blue-100 text-blue-800",
    },
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card
      className={cn(
        "p-5 hover:shadow-lg transition-all duration-200 group",
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-primary text-primary-foreground font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">{id}</p>
          </div>
        </div>
        {status && (
          <Badge variant="secondary" className={statusConfig[status].className}>
            {statusConfig[status].label}
          </Badge>
        )}
      </div>

      <div className="space-y-2.5 mb-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{district}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{school}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <GraduationCap className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>
            {subject}, {level}
          </span>
        </div>
        {email && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {/* Zone Transfer Info */}
      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">
              {t("currentZone")}
            </p>
            <p className="font-medium">{currentZone}</p>
          </div>
          <ArrowRight
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">
              {t("preferredZone")}
            </p>
            <p className="font-medium text-primary">{wantZone}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {onViewProfile && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewProfile}
          >
            {t("viewProfile")}
          </Button>
        )}
        <Button
          size="sm"
          className={cn(onViewProfile ? "flex-1" : "w-full")}
          onClick={onContact}
        >
          {onContact ? t("sendRequest") : t("contact")}
        </Button>
      </div>
    </Card>
  );
}
