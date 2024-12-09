"use client";

import React from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";
import type { WithChildren } from "@/lib/types";

interface BackgroundProps extends WithChildren {}

export function Background({ children }: BackgroundProps): JSX.Element {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const overlayColor = useColorModeValue(
    "rgba(255, 255, 255, 0.8)",
    "rgba(26, 32, 44, 0.8)"
  );

  return (
    <Box
      position="relative"
      minH="100vh"
      bg={bgColor}
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: overlayColor,
        backdropFilter: "blur(8px)",
      }}
    >
      <Box
        position="relative"
        zIndex={1}
        minH="100vh"
        py={8}
        px={4}
      >
        {children}
      </Box>
    </Box>
  );
}

export { Background as default }; 