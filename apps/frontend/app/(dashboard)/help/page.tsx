"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Book } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help & Support</CardTitle>
          <CardDescription>
            Find answers to common questions or contact support
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              <CardTitle className="text-lg">Documentation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Browse our comprehensive guides and tutorials
            </p>
            <Button variant="outline" className="w-full">
              View Docs
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle className="text-lg">Email Support</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get help via email from our support team
            </p>
            <Button variant="outline" className="w-full">
              Contact Us
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with us in real-time for instant help
            </p>
            <Button variant="outline" className="w-full">
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">
                How do I reset my password?
              </h3>
              <p className="text-sm text-muted-foreground">
                You can reset your password by going to Settings &gt; Change
                Password or by clicking "Forgot Password" on the login page.
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">
                How do I create a new class?
              </h3>
              <p className="text-sm text-muted-foreground">
                Navigate to the Classes page and click the "Create Class"
                button. Fill in the required details and submit.
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">How do I schedule an exam?</h3>
              <p className="text-sm text-muted-foreground">
                Go to the Exams page, click "Create Exam", and follow the wizard
                to set up your exam with questions, timing, and settings.
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">
                How do I track student attendance?
              </h3>
              <p className="text-sm text-muted-foreground">
                From your class detail page, navigate to the Attendance tab
                where you can mark and view student attendance records.
              </p>
            </div>
            <div className="pb-4">
              <h3 className="font-semibold mb-2">
                Where can I view my notifications?
              </h3>
              <p className="text-sm text-muted-foreground">
                Click the bell icon in the top navigation bar to view all your
                notifications, or go to the Notifications page from the menu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
