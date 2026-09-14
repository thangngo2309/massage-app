"use client";

import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { useCallback, useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { getTherapist, TherapistDetail } from "@/lib/therapists";
import { TherapistProfileTab } from "./TherapistProfileTab";
import { TherapistServicesTab } from "./TherapistServicesTab";
import { TherapistWorkingHoursTab } from "./TherapistWorkingHoursTab";
import { TherapistExceptionsTab } from "./TherapistExceptionsTab";
import { TherapistAreasTab } from "./TherapistAreasTab";

interface Props {
  open: boolean;
  userId: number | null;

  onClose: () => void;
  onChanged: () => void;
}

export function TherapistDetailDialog({
  open,
  userId,
  onClose,
  onChanged,
}: Props) {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [detail, setDetail] = useState<TherapistDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  const loadData = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getTherapist(userId);

      setDetail(response);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải thông tin kỹ thuật viên"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (open) {
      setTab(0);
      void loadData();
    }
  }, [open, loadData]);

  const handleChanged = () => {
    void loadData();
    onChanged();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      fullScreen={fullScreen}
    >
      <DialogTitle
        component="div"
        sx={{
          pr: 7,
          pb: 0,
        }}
      >
        <Typography variant="h6">
          {detail?.user.fullName ?? "Kỹ thuật viên"}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {detail?.user.phone}
          {detail?.user.email ? ` • ${detail.user.email}` : ""}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mt: 2,
          }}
        >
          <Tab label="Hồ sơ" />
          <Tab label="Dịch vụ & Giá" />
          <Tab label="Giờ làm việc" />
          <Tab label="Ngày ngoại lệ" />
          <Tab label="Khu vực" />
        </Tabs>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 2,
            }}
          >
            {error}
          </Alert>
        )}

        {loading && !detail ? (
          <Box
            sx={{
              minHeight: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : detail ? (
          <Box
            sx={{
              pt: 2,
            }}
          >
            {tab === 0 && (
              <TherapistProfileTab detail={detail} onChanged={handleChanged} />
            )}

            {tab === 1 && (
              <TherapistServicesTab detail={detail} onChanged={handleChanged} />
            )}

            {tab === 2 && (
              <TherapistWorkingHoursTab
                detail={detail}
                onChanged={handleChanged}
              />
            )}

            {tab === 3 && (
              <TherapistExceptionsTab
                detail={detail}
                onChanged={handleChanged}
              />
            )}

            {tab === 4 && (
              <TherapistAreasTab detail={detail} onChanged={handleChanged} />
            )}
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
