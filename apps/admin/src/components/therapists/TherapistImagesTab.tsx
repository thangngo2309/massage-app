"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

import { ChangeEvent, useRef, useState } from "react";

import {
  deleteTherapistImage,
  TherapistImageItem,
  updateTherapistImageOrder,
  uploadTherapistImages,
} from "@/lib/therapists";

interface Props {
  userId: number;

  images: TherapistImageItem[];

  onChanged: () => void;
}

const MAX_IMAGES = 10;

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function TherapistImagesTab({ userId, images, onChanged }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState("");

  const [uploading, setUploading] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [ordering, setOrdering] = useState(false);

  const sortedImages = [...images].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id - b.id
  );

  const handleSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (!files.length) {
      return;
    }

    setError("");

    if (images.length + files.length > MAX_IMAGES) {
      setError(`Mỗi kỹ thuật viên được tải tối đa ${MAX_IMAGES} hình ảnh`);

      return;
    }

    const invalidType = files.find(
      (file) => !ALLOWED_TYPES.includes(file.type)
    );

    if (invalidType) {
      setError("Chỉ hỗ trợ hình ảnh JPEG, PNG hoặc WEBP");

      return;
    }

    const oversized = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversized) {
      setError("Mỗi hình ảnh không được vượt quá 8 MB");

      return;
    }

    try {
      setUploading(true);

      await uploadTherapistImages(userId, files);

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải hình ảnh"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: TherapistImageItem) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa hình ảnh này?");

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setDeletingId(image.id);

      await deleteTherapistImage(userId, image.id);

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể xóa hình ảnh"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleMove = async (imageId: number, direction: "left" | "right") => {
    if (ordering) {
      return;
    }

    const currentIndex = sortedImages.findIndex((item) => item.id === imageId);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex =
      direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= sortedImages.length) {
      return;
    }

    const reordered = [...sortedImages];

    const [current] = reordered.splice(currentIndex, 1);

    reordered.splice(targetIndex, 0, current);

    try {
      setError("");

      setOrdering(true);

      await updateTherapistImageOrder(
        userId,
        reordered.map((item, index) => ({
          id: item.id,

          sortOrder: index,
        }))
      );

      onChanged();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật thứ tự hình ảnh"
      );
    } finally {
      setOrdering(false);
    }
  };

  return (
    <Box>
      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
      />

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
            }}
          >
            Hình ảnh kỹ thuật viên
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Tối đa 10 hình ảnh. Hỗ trợ JPG, PNG và WEBP, tối đa 8 MB mỗi ảnh.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            uploading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <AddPhotoAlternateIcon />
            )
          }
          disabled={uploading || images.length >= MAX_IMAGES}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "Đang tải..." : "Thêm ảnh"}
        </Button>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mt: 1,
        }}
      >
        {images.length}/{MAX_IMAGES} hình ảnh
      </Typography>

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

      {ordering && (
        <Alert
          severity="info"
          sx={{
            mt: 2,
          }}
        >
          Đang lưu thứ tự hình ảnh...
        </Alert>
      )}

      {!sortedImages.length ? (
        <Paper
          variant="outlined"
          sx={{
            mt: 3,
            minHeight: 240,
            borderStyle: "dashed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            p: 4,
            textAlign: "center",
          }}
        >
          <ImageOutlinedIcon
            sx={{
              fontSize: 48,
              color: "text.disabled",
            }}
          />

          <Typography
            sx={{
              mt: 2,
              fontWeight: 700,
            }}
          >
            Chưa có hình ảnh
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Thêm hình ảnh để khách hàng có thể xem thông tin kỹ thuật viên.
          </Typography>

          <Button
            sx={{
              mt: 2,
            }}
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => inputRef.current?.click()}
          >
            Chọn hình ảnh
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            mt: 3,

            display: "grid",

            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",

              sm: "repeat(3, minmax(0, 1fr))",

              md: "repeat(4, minmax(0, 1fr))",
            },

            gap: 2,
          }}
        >
          {sortedImages.map((image, index) => {
            const deleting = deletingId === image.id;

            return (
              <Paper
                key={image.id}
                variant="outlined"
                sx={{
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "relative",

                    aspectRatio: "4 / 5",

                    bgcolor: "grey.100",
                  }}
                >
                  <Box
                    component="img"
                    src={image.imageUrl}
                    alt={`Hình ảnh ${index + 1}`}
                    sx={{
                      width: "100%",

                      height: "100%",

                      objectFit: "cover",

                      display: "block",
                    }}
                  />

                  {index === 0 && (
                    <Box
                      sx={{
                        position: "absolute",

                        top: 8,
                        left: 8,

                        bgcolor: "success.main",

                        color: "success.contrastText",

                        px: 1.2,
                        py: 0.5,

                        borderRadius: 10,

                        fontSize: 12,

                        fontWeight: 700,
                      }}
                    >
                      Ảnh đầu tiên
                    </Box>
                  )}

                  {deleting && (
                    <Box
                      sx={{
                        position: "absolute",

                        inset: 0,

                        bgcolor: "rgba(0,0,0,.45)",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress
                        size={32}
                        sx={{
                          color: "white",
                        }}
                      />
                    </Box>
                  )}
                </Box>

                <Stack
                  direction="row"
                  sx={{
                    p: 1,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row">
                    <Tooltip title="Chuyển sang trái">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === 0 || ordering}
                          onClick={() => void handleMove(image.id, "left")}
                        >
                          <ArrowBackIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Chuyển sang phải">
                      <span>
                        <IconButton
                          size="small"
                          disabled={
                            index === sortedImages.length - 1 || ordering
                          }
                          onClick={() => void handleMove(image.id, "right")}
                        >
                          <ArrowForwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>

                  <Tooltip title="Xóa ảnh">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        disabled={deletingId !== null}
                        onClick={() => void handleDelete(image)}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Paper>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
