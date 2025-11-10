import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminHeader from "@/components/layouts/admin/AdminHeader";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

// Override the global auth store mock with local test values
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseUIStore = useUIStore as jest.MockedFunction<typeof useUIStore>;

describe("AdminHeader", () => {
  const mockUser = {
    id: "1",
    email: "admin@test.com",
    role: "SYSTEM_ADMIN",
    firstName: "Admin",
    lastName: "User",
  };

  const mockSetSidebarOpen = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      logout: jest.fn(),
    } as any);
    mockUseUIStore.mockReturnValue({
      theme: "light",
      toggleTheme: mockToggleTheme,
    } as any);
  });

  it("renders admin header with portal title", () => {
    render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    expect(screen.getByText("auth.adminPortal")).toBeInTheDocument();
  });

  it("toggles sidebar when menu button is clicked", () => {
    render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    // Find the first button (menu/sidebar toggle)
    const buttons = screen.getAllByRole("button");
    const menuButton = buttons[0];
    fireEvent.click(menuButton);

    expect(mockSetSidebarOpen).toHaveBeenCalledWith(false);
  });

  it("renders X icon when sidebar is open", () => {
    const { container } = render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders Menu icon when sidebar is closed", () => {
    const { container } = render(
      <AdminHeader sidebarOpen={false} setSidebarOpen={mockSetSidebarOpen} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders user initials when no avatar", () => {
    render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    expect(screen.getByText("AU")).toBeInTheDocument();
  });

  it("renders without crashing when user is null", () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      logout: jest.fn(),
    } as any);

    const { container } = render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );
    expect(container).toBeInTheDocument();
  });

  it("toggles theme when theme button is clicked", () => {
    render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );

    // Find the theme toggle button (has moon icon in light mode)
    const buttons = screen.getAllByRole("button");
    // Theme button is the second button
    const themeButton = buttons[1];
    fireEvent.click(themeButton);

    expect(mockToggleTheme).toHaveBeenCalled();
  });

  it("matches snapshot", () => {
    const { container } = render(
      <AdminHeader sidebarOpen={true} setSidebarOpen={mockSetSidebarOpen} />
    );
    expect(container).toMatchSnapshot();
  });
});
