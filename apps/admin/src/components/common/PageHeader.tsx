"use client";

import { Box, Stack, Typography } from "@mui/material";

import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: Props) {
  return (
    <Stack
      sx={{
        display: "flex",
        flexDirection: {
          xs: "column",
          sm: "row",
        },
        justifyContent: "space-between",
        alignItems: {
          xs: "flex-start",
          sm: "center",
        },
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 5,
            height: 38,
            flexShrink: 0,
            borderRadius: 999,
            bgcolor: "primary.main",
          }}
        />

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontSize: {
                xs: "1.3rem",
                md: "1.5rem",
              },
            }}
          >
            {title}
          </Typography>

          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.4,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {actions && (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          {actions}
        </Box>
      )}
    </Stack>
  );
}
