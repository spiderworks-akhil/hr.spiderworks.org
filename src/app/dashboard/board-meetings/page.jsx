"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { BASE_URL } from "@/services/baseUrl";

const BoardMeetingFormPopup = dynamic(
  () =>
    import("@/components/dashboard/board-meeting-form/BoardMeetingFormPopup"),
  { ssr: false }
);

const BoardMeeting = () => {
  const [boardMeetings, setBoardMeetings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [boardMeetingToDelete, setBoardMeetingToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editBoardMeeting, setEditBoardMeeting] = useState(null);

  const columns = [
    { field: "title", headerName: "Title", width: 200 },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "meeting_location",
      headerName: "Location",
      width: 200,
      renderCell: (params) => <span>{params.value ? params.value : "-"}</span>,
    },
    {
      field: "participants",
      headerName: "Participants",
      width: 200,
      renderCell: (params) => <span>{params.value ? params.value : "-"}</span>,
    },
    {
      field: "agenda",
      headerName: "Agenda",
      width: 250,
      renderCell: (params) => <span>{params.value ? params.value : "-"}</span>,
    },
    {
      field: "meeting_minutes",
      headerName: "Meeting Minutes",
      width: 250,
      renderCell: (params) => <span>{params.value ? params.value : "-"}</span>,
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit board meeting record"
          className="p-1"
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
          aria-label="Delete board meeting record"
          className="p-1"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditBoardMeeting(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (boardMeeting) => {
    setEditBoardMeeting(boardMeeting);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditBoardMeeting(null);
  };

  const handleOpenDeletePopover = (event, boardMeeting) => {
    setAnchorEl(event.currentTarget);
    setBoardMeetingToDelete(boardMeeting);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setBoardMeetingToDelete(null);
  };

  const handleDeleteBoardMeeting = async () => {
    if (!boardMeetingToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/board-meeting/delete/${boardMeetingToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete board meeting record"
        );
      }

      const data = await response.json();
      toast.success(
        data.message || "Board meeting record deleted successfully!",
        {
          position: "top-right",
        }
      );

      await fetchBoardMeetings(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete board meeting record:", error);
      setFetchError(
        error.message ||
          "Failed to delete board meeting record. Please try again."
      );
      toast.error(error.message || "Failed to delete board meeting record.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBoardMeetings = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/board-meeting/list?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch board meeting records");
      }

      const data = await response.json();
      const records = (data.data?.boardMeetings || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid board meeting record entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          date: record.date || null,
          meeting_location: record.meeting_location || null,
          participants: record.participants || null,
          agenda: record.agenda || null,
          meeting_minutes: record.meeting_minutes || null,
          createdBy: record.createdBy || null,
          updatedBy: record.updatedBy || null,
        }));

      setBoardMeetings(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch board meeting records:", error);
      setFetchError("Failed to load board meeting records. Please try again.");
      setBoardMeetings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardMeetings(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditBoardMeeting(null);
    fetchBoardMeetings(page, searchQuery);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No board meeting records found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Board Meeting Records ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-teal-500 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-teal-600"
        >
          <span>+ Add Board Meeting Record</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y- Cd, space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Board Meeting Records"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" size={15} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <Paper sx={{ width: "100%", boxShadow: "none" }}>
          <DataGrid
            rows={boardMeetings}
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
                backgroundColor: "rgba(234, 248, 244, 0.8)",
                "&:hover": {
                  backgroundColor: "rgba(234, 248, 244, 0.8)",
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
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                outline: "none",
              },
            }}
            slots={{
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              pagination: {
                showRowsPerPage: false,
              },
            }}
          />
        </Paper>
      )}

      <BoardMeetingFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        boardMeeting={editBoardMeeting}
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
            <strong className="font-bold">{boardMeetingToDelete?.title}</strong>
            ?
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
              onClick={handleDeleteBoardMeeting}
              color="error"
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

export default BoardMeeting;
