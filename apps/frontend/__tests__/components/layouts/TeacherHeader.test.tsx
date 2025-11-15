import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TeacherHeader from "@/components/layouts/teacher/TeacherHeader";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

// Override the global auth store mock with local test values
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;

describe("TeacherHeader", () => {
  const mockTeacher = {
    id: "2",
    email: "teacher@test.com",
    role: "INTERNAL_TEACHER",
    firstName: "John",
    lastName: "Doe",
  };

  const mockSetSidebarOpen = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockTeacher,
      logout: jest.fn(),
    } as any);
    mockUseUIStore.mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
    } as any);
  });

  it("renders teacher header with branding", () => {
    render(
      <TeacherHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    expect(screen.getByText("auth.teacherPortal")).toBeInTheDocument();
  });

  it("toggles sidebar when menu button is clicked", () => {
    render(
      <TeacherHeader sidebarOpen={false} setSidebarOpen={mockSetSidebarOpen} />
    );

    const buttons = screen.getAllByRole("button");
    const menuButton = buttons[0];
    fireEvent.click(menuButton);

    expect(mockSetSidebarOpen).toHaveBeenCalledWith(true);
  });

  it("renders notification and theme toggle buttons", () => {
    const { container } = render(
      <TeacherHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    // Multiple buttons should exist (theme toggle, notifications, profile)
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(1);
  });

  it("renders with sidebar open state", () => {
    const { container } = render(
      <TeacherHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );
    expect(container).toBeInTheDocument();
  });

  it("renders user initials when no avatar", () => {
    render(
      <TeacherHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("matches snapshot", () => {
    const { container } = render(
      <TeacherHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );
    expect(container).toMatchSnapshot();
  });
});
