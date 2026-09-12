"use client";

import { Box, Paper } from "@mui/material";

import {
  DataGrid,
  DataGridProps,
  GridPaginationModel,
  GridValidRowModel,
} from "@mui/x-data-grid";

interface GenericDataGridProps<R extends GridValidRowModel>
  extends Omit<
    DataGridProps<R>,
    "rows" | "columns" | "paginationModel" | "onPaginationModelChange"
  > {
  rows: DataGridProps<R>["rows"];
  columns: DataGridProps<R>["columns"];
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  minWidth?: number;
}

export function GenericDataGrid<R extends GridValidRowModel>({
  rows,
  columns,

  paginationModel,
  onPaginationModelChange,

  minWidth = 900,

  pageSizeOptions = [10, 20, 50, 100],

  ...props
}: GenericDataGridProps<R>) {
  return (
    <Paper
      sx={{
        width: "100%",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: "100%",
          overflowX: "auto",
        }}
      >
        <Box
          sx={{
            minWidth: {
              xs: minWidth,
              lg: "100%",
            },
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            pageSizeOptions={pageSizeOptions}
            autoHeight
            disableRowSelectionOnClick
            sx={{
              border: 0,
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                color: "#334155",
              },
              "& .MuiDataGrid-cell": {
                display: "flex",
                alignItems: "center",
                borderColor: "#EDF2F7",
              },
              "& .MuiDataGrid-row": {
                transition: "background-color .15s ease",
                "&:hover": {
                  backgroundColor: "#F0FDFA",
                },
              },

              "& .MuiDataGrid-footerContainer": {
                backgroundColor: "#F8FAFC",
                borderTop: "1px solid #E2E8F0",
                minHeight: 54,
              },

              "& .MuiDataGrid-overlayWrapper": {
                minHeight: 160,
              },
            }}
            {...props}
          />
        </Box>
      </Box>
    </Paper>
  );
}
