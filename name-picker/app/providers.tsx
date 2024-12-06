'use client'

import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider, extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
  components: {
    Card: {
      baseStyle: {
        container: {
          boxShadow: 'lg',
          rounded: 'xl',
          p: 6,
          bg: 'white',
        },
      },
    },
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      variants: {
        solid: {
          bg: 'blue.500',
          color: 'white',
          _hover: {
            bg: 'blue.600',
          },
        },
      },
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  )
}
