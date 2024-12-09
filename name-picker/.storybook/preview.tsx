import React from "react";
import type { Preview } from "@storybook/react";
import { ChakraProvider, CSSReset } from "@chakra-ui/react";
import { theme } from "../app/theme/config";
import "../app/styles/globals.scss";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ChakraProvider theme={theme}>
        <CSSReset />
        <Story />
      </ChakraProvider>
    ),
  ],
};

export default preview; 