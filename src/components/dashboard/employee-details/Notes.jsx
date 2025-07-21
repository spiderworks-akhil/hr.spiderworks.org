"use client";

import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Popover,
  Paper,
  Box,
} from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const EmployeeNotes = ({ employee }) => {
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    id: 0,
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    noteId: null,
  });

  const { data: session, status: sessionStatus } = useSession();

  const fetchNotes = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-note/list/${employee.id}?page=${
          page + 1
        }&limit=100${search ? `&keyword=${encodeURIComponent(search)}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }
      const data = await response.json();
      setNotes(data.data?.employeeNotes || []);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
      setFetchError(error.message || "Failed to load notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenModal = (mode, note = null) => {
    setModalMode(mode);
    if (mode === "edit" && note) {
      setFormData({
        id: note.id,
        notes: note.notes,
      });
    } else {
      setFormData({
        id: 0,
        notes: "",
      });
    }
    setNoteError(null);
    setFormError(null);
    setApiError(null);
    setSubmitted(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      id: 0,
      notes: "",
    });
    setNoteError(null);
    setFormError(null);
    setApiError(null);
    setSubmitted(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      notes: e.target.value,
    });
    if (e.target.value && noteError) {
      setNoteError(null);
    }
    if (e.target.value && formError) {
      setFormError(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    let hasError = false;

    if (!formData.notes) {
      setNoteError("Note is required");
      hasError = true;
    }

    if (hasError) return;

    const userId = session?.user?.id;
    const payload = {
      notes: formData.notes,
      employee_id: employee.id,
      ...(modalMode === "add"
        ? { created_by: userId, updated_by: userId }
        : { updated_by: userId }),
    };

    try {
      setLoading(true);
      setNoteError(null);
      setFormError(null);
      setApiError(null);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-note/create`
          : `${BASE_URL}/api/employee-note/update/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Unknown error occurred";
        if (data.message) {
          errorMessage = Array.isArray(data.message)
            ? data.message.join(", ")
            : String(data.message);
        }
        throw new Error(
          errorMessage ||
            `Failed to ${modalMode === "add" ? "create" : "update"} note`
        );
      }

      toast.success(data.message || "Note saved successfully!", {
        position: "top-right",
      });

      await fetchNotes(page, searchQuery);
      handleCloseModal();
    } catch (error) {
      console.error(
        `Failed to ${modalMode === "add" ? "create" : "update"} note:`,
        error
      );
      setApiError(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } note. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>No notes found</Box>
  );

  const columns = [
    { field: "notes", headerName: "Note", width: 300 },
    {
      field: "created_at",
      headerName: "Created At",
      width: 120,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "created_by",
      headerName: "Created By",
      width: 120,
      renderCell: (params) => {
        const createdBy = params.row.createdBy;
        if (createdBy && (createdBy.first_name || createdBy.last_name)) {
          return (
            <>
              {`${createdBy.first_name || ""} ${
                createdBy.last_name || ""
              }`.trim()}
            </>
          );
        }
        return <>{params.value || "-"}</>;
      },
    },
    {
      field: "updated_at",
      headerName: "Updated At",
      width: 120,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "updated_by",
      headerName: "Updated By",
      width: 120,
      renderCell: (params) => {
        const updatedBy = params.row.updatedBy;
        if (updatedBy && (updatedBy.first_name || updatedBy.last_name)) {
          return (
            <>
              {`${updatedBy.first_name || ""} ${
                updatedBy.last_name || ""
              }`.trim()}
            </>
          );
        }
        return <>{params.value || "-"}</>;
      },
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenModal("edit", params.row)}
          aria-label="Edit note"
          disabled={params.row.is_system === 1}
          style={{
            cursor: params.row.is_system === 1 ? "not-allowed" : "pointer",
            opacity: params.row.is_system === 1 ? 0.5 : 1,
            background: "none",
            border: "none",
            padding: 0,
          }}
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" reverseOrder={true} />
      {fetchError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {fetchError}
        </Typography>
      )}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}
      >
        <TextField
          variant="outlined"
          placeholder="Search Notes"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            flex: 1,
            maxWidth: 300,
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              "& fieldset": {
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(0, 0, 0, 0.4)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "rgb(42,196,171)",
              },
            },
            "& .MuiInputBase-input": {
              padding: "10px 14px",
            },
          }}
        />
        <Button
          variant="contained"
          sx={{
            backgroundColor: "rgb(42,196,171)",
            "&:hover": { backgroundColor: "rgb(35,170,148)" },
          }}
          onClick={() => handleOpenModal("add")}
          disabled={sessionStatus !== "authenticated"}
        >
          Add Note
        </Button>
      </Box>
      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <BeatLoader color="rgb(42,196,171)" size={12} />
          </Box>
        ) : (
          <DataGrid
            rows={notes}
            columns={columns}
            autoHeight
            initialState={{
              pagination: { paginationModel: { page, pageSize: 100 } },
            }}
            pagination
            paginationMode="server"
            rowCount={total}
            onPaginationModelChange={(newModel) => setPage(newModel.page)}
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
                showRowsPerPage: false,
              },
            }}
          />
        )}
      </Paper>

      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        sx={{
          "& .MuiDialog-paper": {
            width: { xs: "90vw", sm: "500px" },
            maxHeight: "80vh",
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">
          {modalMode === "add" ? "Add Note" : "Edit Note"}
        </DialogTitle>
        <DialogContent className="overflow-y-auto">
          {apiError && <Box className="text-red-600 mb-4">{apiError}</Box>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box>
              <label className="block mb-1 text-md">Notes *</label>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="notes"
                placeholder="Enter notes"
                value={formData.notes}
                onChange={handleInputChange}
                error={submitted && !formData.notes}
                helperText={
                  submitted && !formData.notes ? "Note is required" : ""
                }
                variant="outlined"
                size="small"
                className="bg-white"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "rgba(42,196,171, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(42,196,171)",
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "", px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={handleCloseModal}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            sx={{
              backgroundColor: "rgb(42,196,171)",
              color: "white",
              "&:hover": { backgroundColor: "rgb(36,170,148)" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading || sessionStatus !== "authenticated"}
          >
            {loading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EmployeeNotes;
