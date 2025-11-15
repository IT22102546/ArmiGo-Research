"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users } from "lucide-react";
import { usersApi } from "@/lib/api/endpoints/users";
import RoleUserTable from "./RoleUserTable";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import ViewUserModal from "./ViewUserModal";
import { handleApiError, handleApiSuccess } from "@/lib/error-handling";
import { PageHeader } from "@/components/shared";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  teachingSubjects?: any[];
  studentProfile?: any;
  teacherProfile?: any;
  institution?: string;
  medium?: string;
}

type UserRole =
  | "INTERNAL_STUDENT"
  | "EXTERNAL_STUDENT"
  | "INTERNAL_TEACHER"
  | "EXTERNAL_TEACHER";

const UserManagementPanel: React.FC = () => {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<UserRole>("INTERNAL_STUDENT");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(t("confirmDeleteSingle"))) return;

    try {
      await usersApi.delete(userId);
      handleApiSuccess(t("deleteSuccess"));
      handleRefresh();
    } catch (error) {
      handleApiError(
        error,
        "UserManagementPanel.handleDelete",
        "Failed to delete user"
      );
    }
  };

  const handleAddSuccess = () => {
    handleRefresh();
  };

  const handleEditSuccess = () => {
    handleRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t("title")}
        description={t("description")}
        icon={Users}
        actions={
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("addUser")}
          </Button>
        }
      />

      {/* Role Tabs with Separate Tables */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as UserRole)}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="INTERNAL_STUDENT">
            {t("roles.internalStudent")}
          </TabsTrigger>
          <TabsTrigger value="EXTERNAL_STUDENT">
            {t("roles.externalStudent")}
          </TabsTrigger>
          <TabsTrigger value="INTERNAL_TEACHER">
            {t("roles.internalTeacher")}
          </TabsTrigger>
          <TabsTrigger value="EXTERNAL_TEACHER">
            {t("roles.externalTeacher")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="INTERNAL_STUDENT">
          <RoleUserTable
            role="INTERNAL_STUDENT"
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="EXTERNAL_STUDENT">
          <RoleUserTable
            role="EXTERNAL_STUDENT"
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="INTERNAL_TEACHER">
          <RoleUserTable
            role="INTERNAL_TEACHER"
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="EXTERNAL_TEACHER">
          <RoleUserTable
            role="EXTERNAL_TEACHER"
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AddUserModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditUserModal
        open={isEditModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={handleEditSuccess}
      />

      <ViewUserModal
        open={isViewModalOpen}
        user={selectedUser}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedUser(null);
        }}
        onUserUpdated={() => {
          // Refresh the user list when enrollments are updated
          handleRefresh();
        }}
      />
    </div>
  );
};

export default UserManagementPanel;
