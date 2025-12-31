import type { User, Theme, NoraConfig } from '@teamwise/nora-sdk';

export const noraUser: User = {
  name: 'FactoryX',
  desc: '',
  image: '/favicon-white-bg.svg',
};

export const noraTheme: Theme = {
  designSystem: {
    colors: {
      light: {
        '50': 'hsl(222 0% 100%)',
        '100': 'hsl(222 100% 99%)',
        '200': 'hsl(222 50% 96%)',
        '300': 'hsl(222 29% 90%)',
        '700': 'hsl(222 100% 57%)',
        '900': 'hsl(222 85% 50%)',
        baseHue: 222,
        textStrong: '#121212',
        textMedium: '#12121246',
        textLight: '#12121232',
        outlineStrong: '#00000014',
        outlineLight: '#00000008',
        hoverStrong: '#00000004',
        hoverLight: '#00000001',
        hoverOverlay: '#00000014',
        warning: '#ff1c51',
        warningBg: '#e3002a08',
        background: '#ffffff',
        shadow: '4px 4px 12px -8px rgba(0, 0, 0, 0.2)',
      },
      dark: {
        '50': 'hsl(222 9% 9%)',
        '100': 'hsl(222 11% 12%)',
        '200': 'hsl(222 12% 15%)',
        '300': 'hsl(222 12% 21%)',
        '700': 'hsl(222 100% 61%)',
        '900': 'hsl(222 69% 81%)',
        baseHue: 222,
        textStrong: '#ffffff',
        textMedium: '#ffffff4b',
        textLight: '#ffffff32',
        outlineStrong: '#ffffff0c',
        outlineLight: '#ffffff0c',
        hoverStrong: '#ffffff08',
        hoverLight: '#ffffff04',
        hoverOverlay: '#ffffff28',
        warning: '#ff1c51',
        warningBg: '#ff1c510c',
        background: '#1a1a1a',
        shadow: '4px 4px 12px -8px rgba(0, 0, 0, 0.4)',
      },
    },
    typography: {
      fontFamily: {
        english: {
          sans: 'Manrope, sans-serif',
          serif: 'Merriweather, serif',
          creative: 'Space Grotesk, sans-serif',
        },
        korean: {
          sans: 'Pretendard, sans-serif',
          gowun: 'Gowun Dodum, sans-serif',
          creative: "'나눔스퀘어 네오', sans-serif",
        },
        code: "'JetBrains Mono', monospace",
      },
      styles: {
        heading0: {
          weight: 700,
          size: '5em',
          line: '1.2',
          letter: '-0.04em',
        },
        heading1: {
          weight: 700,
          size: '3.125em',
          line: '1.2',
          letter: '-0.04em',
        },
        heading2: {
          weight: 700,
          size: '2em',
          line: '1.2',
          letter: '-0.04em',
        },
        heading3: {
          weight: 700,
          size: '1.5em',
          line: '1.4',
          letter: '-0.04em',
        },
        heading4: {
          weight: 600,
          size: '1.125em',
          line: '1.6',
          letter: '-0.03em',
        },
        heading5: {
          weight: 600,
          size: '1em',
          line: '1.7',
          letter: '-0.03em',
        },
        heading6: {
          weight: 400,
          size: '0.875em',
          line: '1.6',
          letter: '-0.03em',
        },
        body: {
          weight: 400,
          size: '1em',
          line: '1.7',
          letter: '-0.02em',
        },
        bodyBold: {
          weight: 700,
          size: '1em',
          line: '1.7',
          letter: '-0.02em',
        },
        tooltip: {
          weight: 500,
          size: '0.8125em',
          line: '1.6',
          letter: '-0.03em',
        },
        keyboard: {
          weight: 400,
          size: '0.75em',
          line: '1.5',
          letter: '0em',
        },
        chatH1: {
          weight: 600,
          size: '1.3125em',
          line: '1.6',
          letter: '-0.02em',
        },
        chatH2: {
          weight: 600,
          size: '1.1875em',
          line: '1.6',
          letter: '-0.02em',
        },
        chatBody: {
          weight: 400,
          size: '1em',
          line: '1.9',
          letter: '-0.02em',
        },
        code: {
          weight: 400,
          size: '0.9375em',
          line: '1.6',
          letter: '-0.02em',
        },
        button: {
          weight: 400,
          size: '0.875em',
          line: '1.6',
          letter: '-0.01em',
        },
      },
      baseFontSize: 16,
      fontStyle: 'sans',
    },
    radius: {
      level: 'rounded',
      base: 16,
    },
  },
  language: 'english',
  colorMode: 'light',
  colorIntensity: 'soft',
};

export const noraConfig: NoraConfig = {
  sidebar: {
    variant: 'solid',
  },
  chat: {
    models: [
      {
        displayName: 'GPT-5',
        modelIcon: 'ChatGPT',
        modelName: 'gpt-5',
      },
      {
        displayName: 'Claude',
        modelIcon: 'Claude',
        modelName: 'claude',
      },
      {
        displayName: 'Gemini',
        modelIcon: 'Gemini',
        modelName: 'gemini',
      },
      {
        displayName: 'Grok',
        modelIcon: 'Grok',
        modelName: 'grok',
      },
    ],
    multiModel: false,
    inputLine: 'multi',
    newChatStyles: {
      align: 'center',
      style: 'logo',
    },
    enableFileUpload: false,
    placeholder: 'Ask Anything',
    background: 'default',
    streamingAnimation: 'cosmos',
  },
};
