import React from "react";
import type { Meta } from "@storybook/react";
import { Box } from "@chakra-ui/react";
import { Card } from "./index";

const meta = {
  title: "Components/Core/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} as Meta<typeof Card>;

export default meta;

interface TemplateProps {
  children: React.ReactNode;
  variant?: "elevated" | "outline" | "filled" | "unstyled";
  isHoverable?: boolean;
  isClickable?: boolean;
}

const Template = ({ children, ...args }: TemplateProps) => (
  <Card {...args}>
    <Box p={4}>{children}</Box>
  </Card>
);

export const Default = {
  render: () => <Template>Default Card</Template>,
};

export const Outline = {
  render: () => <Template variant="outline">Outline Card</Template>,
};

export const Filled = {
  render: () => <Template variant="filled">Filled Card</Template>,
};

export const Hoverable = {
  render: () => <Template isHoverable>Hoverable Card</Template>,
};

export const Clickable = {
  render: () => <Template isClickable>Clickable Card</Template>,
}; 