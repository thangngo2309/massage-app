"use client";

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";

import PeopleIcon from "@mui/icons-material/People";
import SpaIcon from "@mui/icons-material/Spa";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common";
import { useAuthStore } from "@/store/authStore";

const shortcuts = [
  {
    title: "Người dùng",
    description: "Khách hàng và tài khoản quản trị.",
    path: "/users",
    icon: <PeopleIcon />,
  },
  {
    title: "Kỹ thuật viên",
    description: "Hồ sơ và hoạt động của kỹ thuật viên.",
    path: "/therapists",
    icon: <SpaIcon />,
  },
  {
    title: "Dịch vụ",
    description: "Danh mục và cấu hình dịch vụ massage.",
    path: "/services",
    icon: <MedicalServicesIcon />,
  },
  {
    title: "Booking",
    description: "Theo dõi và quản lý các lịch đặt.",
    path: "/bookings",
    icon: <CalendarMonthIcon />,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Tổng quan"
        description={`Xin chào ${
          user?.fullName ?? ""
        }, chúc bạn một ngày làm việc hiệu quả.`}
      />

      <Paper
        sx={{
          p: {
            xs: 2,
            md: 3,
          },

          background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",

          color: "#FFFFFF",

          border: 0,
        }}
      >
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
          <Box>
            <Typography variant="h6">{user?.fullName}</Typography>

            <Typography
              variant="body2"
              sx={{
                opacity: 0.85,

                mt: 0.5,
              }}
            >
              {user?.email ?? user?.phone}
            </Typography>
          </Box>

          <Chip
            label={
              user?.role === "super_admin" ? "Super Admin" : "System Admin"
            }
            sx={{
              bgcolor: "rgba(255,255,255,.18)",

              color: "#FFFFFF",
            }}
          />
        </Stack>
      </Paper>

      <Box>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
          }}
        >
          Truy cập nhanh
        </Typography>

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",

              sm: "repeat(2, 1fr)",

              xl: "repeat(4, 1fr)",
            },

            gap: 2,
          }}
        >
          {shortcuts.map((item) => (
            <Paper
              key={item.path}
              sx={{
                p: 2.5,

                minHeight: 190,

                display: "flex",

                flexDirection: "column",

                transition: "all .2s ease",

                "&:hover": {
                  transform: "translateY(-3px)",

                  boxShadow: "0 10px 25px rgba(15, 118, 110, .10)",

                  borderColor: "primary.light",
                },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  borderRadius: 2,

                  bgcolor: "#E6F7F5",

                  color: "primary.main",

                  mb: 2,
                }}
              >
                {item.icon}
              </Box>

              <Typography variant="h6">{item.title}</Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.8,
                  flex: 1,
                }}
              >
                {item.description}
              </Typography>

              <Button
                endIcon={<ArrowForwardIcon />}
                onClick={() => router.push(item.path)}
                sx={{
                  mt: 2,

                  alignSelf: "flex-start",
                }}
              >
                Quản lý
              </Button>
            </Paper>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
