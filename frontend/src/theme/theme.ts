import { createTheme } from '@mui/material/styles'
import { merkurColors } from './palette'

declare module '@mui/material/styles' {
  interface Palette {
    merkur: typeof merkurColors
  }

  interface PaletteOptions {
    merkur?: typeof merkurColors
  }
}

export const theme = createTheme({
  palette: {
    merkur: merkurColors,
    primary: {
      main: merkurColors.pink,
      dark: merkurColors.darkPink,
      contrastText: '#fff',
    },
    secondary: {
      main: merkurColors.blue,
      contrastText: '#fff',
    },
    info: {
      main: merkurColors.cyan,
    },
    success: {
      main: merkurColors.green,
    },
    warning: {
      main: merkurColors.yellow,
    },
    error: {
      main: merkurColors.red,
    },
    text: {
      primary: '#2d2d2d',
      secondary: merkurColors.darkGray,
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          minHeight: '100vh',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#fff',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        sizeLarge: {
          padding: '0.85rem 2rem',
          fontSize: '1.15rem',
        },
      },
      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            background: `linear-gradient(135deg, ${merkurColors.pink}, ${merkurColors.darkPink})`,
            boxShadow: '0 4px 15px rgba(255, 45, 85, 0.35)',
            '&:hover': {
              background: `linear-gradient(135deg, ${merkurColors.pink}, ${merkurColors.darkPink})`,
              boxShadow: '0 10px 20px rgba(255, 45, 85, 0.4)',
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
        },
      ],
    },
  },
})
