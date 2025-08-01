"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import moment from "moment";
import { BASE_URL } from "@/services/baseUrl";

// Dynamically import AwardWinnerFormPopup with SSR disabled
const AwardWinnerFormPopup = dynamic(
  () => import("@/components/dashboard/award-winner-form/AwardWinnerFormPopup"),
  { ssr: false }
);

const AwardWinners = () => {
  const [awardWinners, setAwardWinners] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [awardWinnerToDelete, setAwardWinnerToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editAwardWinner, setEditAwardWinner] = useState(null);

  const columns = [
    { field: "title", headerName: "Title", width: 200 },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      renderCell: (params) => (
        <>
          {params.row.description && params.row.description.trim() !== ""
            ? params.row.description
            : "-"}
        </>
      ),
    },
    {
      field: "awarder_date",
      headerName: "Awarder Date",
      width: 150,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "employee",
      headerName: "Employee",
      width: 150,
      renderCell: (params) => (
        <>
          {params.row.employee?.name && params.row.employee.name.trim() !== ""
            ? params.row.employee.name
            : "-"}
        </>
      ),
    },
    {
      field: "awardProgram",
      headerName: "Award Program",
      width: 150,
      renderCell: (params) => (
        <>
          {params.row.awardProgram?.title &&
          params.row.awardProgram.title.trim() !== ""
            ? params.row.awardProgram.title
            : "-"}
        </>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit award winner"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={(event) => handleOpenDeletePopover(event, params.row)}
          aria-label="Delete award winner"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditAwardWinner(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (awardWinner) => {
    setEditAwardWinner(awardWinner);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditAwardWinner(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditAwardWinner(null);
    fetchAwardWinners(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, awardWinner) => {
    setAnchorEl(event.currentTarget);
    setAwardWinnerToDelete(awardWinner);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setAwardWinnerToDelete(null);
  };

  const handleDeleteAwardWinner = async () => {
    if (!awardWinnerToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/award-winner/delete/${awardWinnerToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete award winner");
      }

      const data = await response.json();
      toast.success(data.message || "Award winner deleted successfully!", {
        position: "top-right",
      });

      await fetchAwardWinners(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete award winner:", error);
      setFetchError(
        error.message || "Failed to delete award winner. Please try again."
      );
      toast.error(error.message || "Failed to delete award winner.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAwardWinners = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/award-winner/list?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch award winners");
      }

      const data = await response.json();
      const awardWinners = (data.data?.awardWinners || [])
        .filter((winner) => {
          if (!winner || typeof winner !== "object" || !winner.id) {
            console.warn("Invalid award winner entry:", winner);
            return false;
          }
          return true;
        })
        .map((winner) => ({
          ...winner,
          description: winner.description || null,
          awarder_date: winner.awarder_date || null,
          employee: winner.employee || null,
          awardProgram: winner.awardProgram || null,
        }));

      setAwardWinners(awardWinners);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch award winners:", error);
      setFetchError("Failed to load award winners. Please try again.");
      setAwardWinners([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwardWinners(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No award winners found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Award Winners ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Award Winner</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Award Winners"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" size={15} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <>
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={awardWinners}
              getRowId={(row) => row.id}
              columns={columns}
              autoHeight
              initialState={{
                pagination: { paginationModel: { page, pageSize: limit } },
              }}
              pagination
              paginationMode="server"
              rowCount={total}
              onPaginationModelChange={(newModel) => setPage(newModel.page)}
              loading={loading}
              sx={{
                border: 0,
                boxShadow: "none",
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "rgba(234, 248, 244, 1)",
                  "&:hover": {
                    backgroundColor: "rgba(234, 248, 244, 1)",
                  },
                },
                "& .MuiDataGrid-cell": {
                  border: "none",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "none",
                  borderBottom: "none",
                },
                "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader--sorted":
                  {
                    outline: "none",
                  },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell--sorted":
                  {
                    outline: "none",
                  },
              }}
              slots={{
                noRowsOverlay: CustomNoRowsOverlay,
              }}
              slotProps={{
                pagination: {
                  showrowsperpage: "false",
                },
              }}
            />
          </Paper>
        </>
      )}

      <AwardWinnerFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        awardWinner={editAwardWinner}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseDeletePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 260 }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete{" "}
            <strong>{awardWinnerToDelete?.title}</strong>?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCloseDeletePopover}
              sx={{
                borderColor: "#ef5350",
                color: "#ef5350",
                "&:hover": { borderColor: "#e53935", color: "#e53935" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              onClick={handleDeleteAwardWinner}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default AwardWinners;
