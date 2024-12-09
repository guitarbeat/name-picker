"use client";

import React from "react";
import {
  Box,
  useColorModeValue,
  type BoxProps,
  forwardRef,
} from "@chakra-ui/react";
import { motion, type HTMLMotionProps } from "framer-motion";

type CardProps = BoxProps & {
  variant?: "elevated" | "outline" | "filled" | "unstyled";
  motionProps?: HTMLMotionProps<"div">;
  isHoverable?: boolean;
  isClickable?: boolean;
};

type MotionBoxProps = BoxProps & HTMLMotionProps<"div">;

// @ts-expect-error - Known issue with motion and Chakra UI types
const MotionBox = motion(Box) as React.FC<MotionBoxProps>;

function CardComponent(
  {
    variant = "elevated",
    motionProps,
    isHoverable = false,
    isClickable = false,
    children,
    ...rest
  }: CardProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Theme colors
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // Base styles
  const baseStyles = {
    bg,
    borderRadius: "xl",
    transition: "all 0.2s",
    overflow: "hidden",
  };

  // Variant styles
  const variantStyles = {
    elevated: {
      boxShadow: "lg",
      border: "1px solid",
      borderColor: "transparent",
    },
    outline: {
      border: "1px solid",
      borderColor,
    },
    filled: {
      bg: useColorModeValue("gray.100", "gray.700"),
    },
    unstyled: {},
  };

  // Interactive styles
  const interactiveStyles = {
    cursor: isClickable ? "pointer" : "default",
    _hover: isHoverable
      ? {
          transform: "translateY(-2px)",
          boxShadow: "xl",
          bg: hoverBg,
        }
      : {},
  };

  // Animation variants
  const animations = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  };

  const motionStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...interactiveStyles,
    ...rest,
  };

  return (
    <MotionBox
      ref={ref}
      {...motionStyles}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={animations}
      {...motionProps}
      // @ts-expect-error - Known issue with Chakra UI and Framer Motion types
      transition="0.2s ease-out"
    >
      {children}
    </MotionBox>
  );
}

export const Card = forwardRef(CardComponent);
Card.displayName = "Card"; 