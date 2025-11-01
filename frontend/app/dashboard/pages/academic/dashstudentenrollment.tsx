import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Eye,
  Search,
  Filter,
  ChevronDown,
  Plus,
  BookOpen,
  UserCheck,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

// Types
interface Student {
  id: string;
  name: string;
  dob: string;
  phone: string;
  email: string;
  grade: string;
  school: string;
}

type TabValue = "internal" | "external";

// Mock data
const students: Student[] = [
  {
    id: "#12345",
    name: "Amila Ranathunge",
    dob: "12.04.2024",
    phone: "0777993567",
    email: "shakco023@gmail.com",
    grade: "Grade 10",
    school: "Heavy",
  },
  {
    id: "#12345",
    name: "Amila Ranathunge",
    dob: "12.04.2024",
    phone: "0777993567",
    email: "shakco023@gmail.com",
    grade: "Grade 10",
    school: "Heavy",
  },
  {
    id: "#12345",
    name: "Amila Ranathunge",
    dob: "12.04.2024",
    phone: "0777993567",
    email: "shakco023@gmail.com",
    grade: "Grade 10",
    school: "Heavy",
  },
  {
    id: "#12345",
    name: "Amila Ranathunge",
    dob: "12.04.2024",
    phone: "0777993567",
    email: "shakco023@gmail.com",
    grade: "Grade 10",
    school: "Heavy",
  },
  {
    id: "#12345",
    name: "Amila Ranathunge",
    dob: "12.04.2024",
    phone: "0777993567",
    email: "shakco023@gmail.com",
    grade: "Grade 10",
    school: "Heavy",
  },
];

const DashStudentEnrollment = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("internal");

  const handleViewProfile = (): void => {
    router.push("/?tab=student-profile");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground">←</span>
            <span className="cursor-pointer hover:text-foreground">
              Student Enrolment
            </span>
            <span>/</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Student Enrolment
            </h1>
            <p className="text-muted-foreground mt-1">
              View Comprehensive Student Details and Training Status
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--stat-blue))] flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total students</p>
                <p className="text-3xl font-bold text-foreground">67</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--stat-orange))] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Internal Students
                </p>
                <p className="text-3xl font-bold text-foreground">03</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--stat-green))] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  External Students
                </p>
                <p className="text-3xl font-bold text-foreground">25</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--stat-red))] flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Students</p>
                <p className="text-3xl font-bold text-foreground">12</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            {/* Tabs and Add Button */}
            <div className="flex items-center justify-between">
              <Tabs
                value={activeTab}
                onValueChange={(value: string) =>
                  setActiveTab(value as TabValue)
                }
              >
                <TabsList className="bg-transparent border-b rounded-none h-auto p-0">
                  <TabsTrigger
                    value="internal"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-[hsl(var(--stat-green))] data-[state=active]:text-white"
                  >
                    Internal
                  </TabsTrigger>
                  <TabsTrigger
                    value="external"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-[hsl(var(--stat-orange))] data-[state=active]:text-white"
                  >
                    External
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add New Student
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search for..." className="pl-9" />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                Status
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              <div className="flex-1" />
              <Button variant="outline" size="sm">
                Export As
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>S.ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>D.OB</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.id}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.dob}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.school}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleViewProfile}
                          className="hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashStudentEnrollment;
