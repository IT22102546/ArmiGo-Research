import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, GraduationCap, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeacherCardProps {
  name: string;
  id: string;
  district: string;
  school: string;
  currentZone: string;
  wantZone: string;
  avatar?: string;
}

export function TeacherCard({
  name,
  id,
  district,
  school,
  currentZone,
  wantZone,
  avatar,
}: TeacherCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{id}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{district}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{school}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <GraduationCap className="h-4 w-4" />
          <span>Tamil, Primary</span>
        </div>
        <div className="flex items-center gap-2 text-primary">
          <span className="text-xs">• Want to: {wantZone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs">• Current: {currentZone}</span>
        </div>
      </div>

      <Button className="w-full" size="default">
        Send Request
      </Button>
    </Card>
  );
}
