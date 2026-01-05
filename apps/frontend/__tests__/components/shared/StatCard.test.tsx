import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { StatCard } from "@/components/shared/StatCard";
import { Users, TrendingUp, DollarSign } from "lucide-react";

describe("StatCard", () => {
  const defaultProps = {
    icon: Users,
    label: "Total Students",
    count: 1234,
    variant: "primary" as const,
  };

  it("renders with required props", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("renders with string count", () => {
    render(<StatCard {...defaultProps} count="$1,234.56" />);
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("applies primary variant styling", () => {
    const { container } = render(<StatCard {...defaultProps} variant="primary" />);
    expect(container.querySelector(".bg-primary")).toBeInTheDocument();
  });

  it("applies success variant styling", () => {
    const { container } = render(<StatCard {...defaultProps} variant="success" />);
    expect(container.querySelector(".bg-green-500")).toBeInTheDocument();
  });

  it("applies warning variant styling", () => {
    const { container } = render(<StatCard {...defaultProps} variant="warning" />);
    expect(container.querySelector(".bg-amber-500")).toBeInTheDocument();
  });

  it("renders different icon types", () => {
    const { rerender } = render(<StatCard {...defaultProps} icon={Users} />);
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    rerender(<StatCard {...defaultProps} icon={TrendingUp} />);
    expect(screen.getByText("Total Students")).toBeInTheDocument();
    rerender(<StatCard {...defaultProps} icon={DollarSign} />);
    expect(screen.getByText("Total Students")).toBeInTheDocument();
  });

  it("handles large numbers correctly", () => {
    render(<StatCard icon={DollarSign} label="Revenue" count={1234567} variant="success" />);
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
  });

  it("renders within a Card component", () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.querySelector(".p-4")).toBeInTheDocument();
  });

  it("has hover effect styling when clickable", () => {
    const handleClick = jest.fn();
    const { container } = render(<StatCard {...defaultProps} onClick={handleClick} />);
    expect(container.firstChild).toHaveClass("cursor-pointer");
  });

  it("matches snapshot", () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it("renders with zero count", () => {
    render(<StatCard {...defaultProps} count={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
