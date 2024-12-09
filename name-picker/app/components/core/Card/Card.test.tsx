import React from "react";
import { render, screen } from "@testing-library/react";
import { Box } from "@chakra-ui/react";
import { Card } from "./index";

describe("Card", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <Box data-testid="card-content">Test Content</Box>
      </Card>
    );
    expect(screen.getByTestId("card-content")).toBeInTheDocument();
  });

  it("applies variant styles correctly", () => {
    const { container } = render(
      <Card variant="outline">
        <Box data-testid="card-content">Test Content</Box>
      </Card>
    );
    expect(container.firstChild).toHaveStyle({
      borderStyle: "solid",
    });
  });

  it("applies hover styles when isHoverable is true", () => {
    const { container } = render(
      <Card isHoverable>
        <Box data-testid="card-content">Hoverable Content</Box>
      </Card>
    );
    expect(container.firstChild).toHaveStyle({
      transition: "all 0.2s",
    });
  });

  it("applies clickable styles when isClickable is true", () => {
    const { container } = render(
      <Card isClickable>
        <Box data-testid="card-content">Clickable Content</Box>
      </Card>
    );
    expect(container.firstChild).toHaveStyle({
      cursor: "pointer",
    });
  });
}); 