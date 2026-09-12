"use client";

import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import SpaIcon from "@mui/icons-material/Spa";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

import { ReactNode, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { AuthGuard } from "@/components/auth/AuthGuard";

import { useAuthStore } from "@/store/authStore";

const drawerWidth = 260;

interface Props {
  children: ReactNode;
}

const menuItems = [
  {
    label: "Tổng quan",
    path: "/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Người dùng",
    path: "/users",
    icon: <PeopleIcon />,
  },
  {
    label: "Kỹ thuật viên",
    path: "/therapists",
    icon: <SpaIcon />,
  },
  {
    label: "Dịch vụ",
    path: "/services",
    icon: <MedicalServicesIcon />,
  },
  {
    label: "Booking",
    path: "/bookings",
    icon: <CalendarMonthIcon />,
  },
];

export function AdminLayout({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "76px !important",

          px: 2,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            mr: 1.5,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          M
        </Box>

        <Box
          sx={{
            minWidth: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, color: "primary.main" }}
            noWrap
          >
            Massage Admin
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block" }}
            noWrap
          >
            {user?.fullName}
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <List
        sx={{
          px: 1.5,
          py: 2,
          flex: 1,
        }}
      >
        {menuItems.map((item) => {
          const selected =
            pathname === item.path || pathname.startsWith(`${item.path}/`);

          return (
            <ListItemButton
              key={item.path}
              selected={selected}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 0.6,
                minHeight: 46,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <List
        sx={{
          p: 1.5,
        }}
      >
        <ListItemButton onClick={() => void handleLogout()}>
          <ListItemIcon
            sx={{
              minWidth: 40,
              color: "error.main",
            }}
          >
            <LogoutIcon />
          </ListItemIcon>

          <ListItemText
            primary="Đăng xuất"
            sx={{
              "& .MuiListItemText-primary": {
                color: "error.main",
                fontWeight: 500,
              },
            }}
          />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <AuthGuard>
      <Box
        sx={{
          minHeight: "100vh",

          display: "flex",

          bgcolor: "background.default",
        }}
      >
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
        >
          <Toolbar>
            <IconButton onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>

            <Typography
              color="primary.main"
              sx={{
                ml: 1,
                flex: 1,
                fontWeight: 700,
              }}
            >
              Massage Admin
            </Typography>

            <Tooltip title={user?.fullName ?? ""}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,

                  bgcolor: "primary.main",

                  fontSize: 15,
                }}
              >
                {user?.fullName?.charAt(0).toUpperCase() ?? "A"}
              </Avatar>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Drawer
          variant="permanent"
          sx={{
            display: {
              xs: "none",
              md: "block",
            },

            width: drawerWidth,

            flexShrink: 0,

            "& .MuiDrawer-paper": {
              width: drawerWidth,

              boxSizing: "border-box",
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: {
              xs: "block",
              md: "none",
            },

            "& .MuiDrawer-paper": {
              width: 280,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,

            minWidth: 0,

            width: {
              xs: "100%",
              md: `calc(100% - ${drawerWidth}px)`,
            },

            pt: {
              xs: 10,
              md: 3,
            },

            px: {
              xs: 1.5,
              sm: 2,
              md: 3,
            },

            pb: 4,
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 1600,
              mx: "auto",
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}
