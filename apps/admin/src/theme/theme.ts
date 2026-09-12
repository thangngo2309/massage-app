"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#0F766E",
      light: "#14B8A6",
      dark: "#115E59",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#4F46E5",
      light: "#6366F1",
      dark: "#4338CA",
      contrastText: "#FFFFFF",
    },

    success: {
      main: "#16A34A",
    },

    warning: {
      main: "#D97706",
    },

    error: {
      main: "#DC2626",
    },

    info: {
      main: "#0284C7",
    },

    background: {
      default: "#F4F7F9",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#17212B",
      secondary: "#64748B",
    },

    divider: "#E2E8F0",
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(","),

    h4: {
      fontWeight: 700,
    },

    h5: {
      fontWeight: 700,
    },

    h6: {
      fontWeight: 700,
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },

        body: {
          margin: 0,
          backgroundColor: "#F4F7F9",
        },
      },
    },

    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },

      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },

      styleOverrides: {
        root: ({ ownerState }) => ({
          minHeight: 40,
          borderRadius: 9,
          paddingLeft: 18,
          paddingRight: 18,
          fontWeight: 600,

          ...(ownerState.variant === "contained" &&
          ownerState.color === "primary"
            ? {
                "&:hover": {
                  backgroundColor: "#115E59",
                },
              }
            : {}),
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          backgroundColor: "#FFFFFF",

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#CBD5E1",
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94A3B8",
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#0F766E",
            borderWidth: 1.5,
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#64748B",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#FFFFFF",
          color: "#17212B",
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,

          "&.Mui-selected": {
            backgroundColor: "#E6F7F5",
            color: "#0F766E",

            "& .MuiListItemIcon-root": {
              color: "#0F766E",
            },

            "&:hover": {
              backgroundColor: "#D8F2EF",
            },
          },

          "&:hover": {
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },

    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "#64748B",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 7,
          fontWeight: 600,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 7,
        },
      },
    },
  },
});
