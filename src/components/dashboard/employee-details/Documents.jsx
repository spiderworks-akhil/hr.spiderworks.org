"use client";

import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Typography,
  Popover,
  Paper,
} from "@mui/material";
import { MdEdit, MdDelete, MdVisibility } from "react-icons/md";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Documents = ({ employee }) => {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [titleError, setTitleError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({ id: 0, title: "", file: null });
  const [submitted, setSubmitted] = useState(false);
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    documentId: null,
  });

  const MAX_FILE_SIZE_5MB = 5 * 1024 * 1024; // 5MB in bytes

  const fetchDocuments = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-documents/list/${employee.id}?page=${
          page + 1
        }&limit=3${search ? `&keyword=${encodeURIComponent(search)}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      const data = await response.json();
      setDocuments(data.data?.documents || []);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setFetchError(
        error.message || "Failed to load documents. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (mode, doc = null) => {
    setModalMode(mode);
    if (mode === "edit" && doc) {
      setFormData({ id: doc.id, title: doc.title, file: null });
    } else {
      setFormData({ id: 0, title: "", file: null });
    }
    setTitleError(null);
    setFileError(null);
    setFormError(null);
    setApiError(null);
    setSubmitted(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ id: 0, title: "", file: null });
    setTitleError(null);
    setFileError(null);
    setFormError(null);
    setApiError(null);
    setSubmitted(false);
  };

  const handleInputChange = (e) => {
    if (e.target.type === "file") {
      const file = e.target.files?.[0];
      if (!file && modalMode === "add") {
        setFileError("Document file is required");
      }
      if (!file && modalMode === "edit") {
        setFileError("");
      }
      if (file) {
        const allowedTypes = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
          setFileError("Only PDF and DOC files are allowed");
          setFormData({ ...formData, file: file });
          setFormError(null);
          return;
        }
        if (file.size > MAX_FILE_SIZE_5MB) {
          setFileError("File size must not exceed 5 MB");
          setFormData({ ...formData, file: file });
          setFormError(null);
          return;
        }
        setFormData({ ...formData, file: file });
        if (fileError) {
          setFileError(null);
        }
        if (formError) {
          setFormError(null);
        }
      } else {
        setFormData({ ...formData, file: null });
      }
    } else {
      setFormData({ ...formData, title: e.target.value });
      if (e.target.value && titleError) {
        setTitleError(null);
      }
      if (e.target.value && formError) {
        setFormError(null);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    let hasError = false;

    if (modalMode === "add") {
      if (!formData.title) {
        setTitleError("Title is required");
        hasError = true;
      }
      if (!formData.file) {
        setFileError("Document file is required");
        hasError = true;
      } else if (formData.file.size > MAX_FILE_SIZE_5MB) {
        setFileError("File size must not exceed 5 MB");
        hasError = true;
      }
    }

    if (modalMode === "edit") {
      if (!formData.title && !formData.file) {
        setFormError("At least one of title or document file is required");
        hasError = true;
      } else if (formData.file && formData.file.size > MAX_FILE_SIZE_5MB) {
        setFileError("File size must not exceed 5 MB");
        hasError = true;
      }
    }

    if (hasError) return;

    const payload = new FormData();
    if (formData.title) {
      payload.append("title", formData.title);
    }
    payload.append("employee_id", employee.id.toString());
    if (formData.file) {
      payload.append("document", formData.file);
    }

    try {
      setLoading(true);
      setTitleError(null);
      setFileError(null);
      setFormError(null);
      setApiError(null);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-documents/create`
          : `${BASE_URL}/api/employee-documents/update/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        body: payload,
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
            `Failed to ${modalMode === "add" ? "create" : "update"} document`
        );
      }

      toast.success(data.message || "Document saved successfully!", {
        position: "top-right",
      });

      await fetchDocuments(page, searchQuery);
      handleCloseDialog();
    } catch (error) {
      console.error(
        `Failed to ${modalMode === "add" ? "create" : "update"} document:`,
        error
      );
      setApiError(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } document. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeletePopover = (event, documentId) => {
    setDeletePopover({ anchorEl: event.currentTarget, documentId });
  };

  const handleCloseDeletePopover = () => {
    setDeletePopover({ anchorEl: null, documentId: null });
  };

  const handleDelete = async () => {
    if (!deletePopover.documentId) return;

    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-documents/delete/${deletePopover.documentId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success(data.message || "Document deleted successfully!", {
        position: "top-right",
      });

      await fetchDocuments(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete document:", error);
      setFetchError(
        error.message || "Failed to delete document. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No documents found
    </Box>
  );

  const columns = [
    { field: "title", headerName: "Title", width: 200 },
    {
      field: "document",
      headerName: "Document",
      width: 200,
      renderCell: (params) => {
        const fileName = params.value.split("_").pop() || "Unknown";
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
            <Typography variant="body2">{fileName}</Typography>
            <a
              href={`${BASE_URL}/${params.value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
              aria-label={`View document ${fileName}`}
            >
              <MdVisibility className="w-5 h-5" />
            </a>
          </Box>
        );
      },
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 120,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenDialog("edit", params.row)}
          aria-label="Edit document"
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
          onClick={(event) => handleOpenDeletePopover(event, params.row.id)}
          aria-label="Delete document"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
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
          placeholder="Search Documents"
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
          onClick={() => handleOpenDialog("add")}
        >
          Upload Document
        </Button>
      </Box>
      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <BeatLoader color="rgb(42,196,171)" size={12} />
          </Box>
        ) : (
          <DataGrid
            rows={documents}
            columns={columns}
            autoHeight
            initialState={{
              pagination: { paginationModel: { page, pageSize: 3 } },
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
        open={openDialog}
        onClose={handleCloseDialog}
        sx={{
          "& .MuiDialog-paper": {
            width: { xs: "90vw", sm: "500px" },
            maxHeight: "80vh",
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">
          {modalMode === "add" ? "Upload Document" : "Edit Document"}
        </DialogTitle>
        <DialogContent className="overflow-y-auto">
          {(formError || apiError) && (
            <Typography color="error" sx={{ mb: 2, fontSize: "0.75rem" }}>
              {formError || apiError}
            </Typography>
          )}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box>
              <label className="block mb-1 text-md">
                Title {modalMode === "add" && "*"}
              </label>
              <TextField
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                size="small"
                error={!!titleError}
                helperText={titleError}
                className="bg-white"
              />
            </Box>
            <Box>
              <label className="block mb-1 text-md">
                Document File {modalMode === "add" && "*"}
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleInputChange}
                style={{ display: "block", width: "100%" }}
              />
              {fileError && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ fontSize: "0.75rem" }}
                >
                  {fileError}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "justify-between", px: 3, pb: 3, pt: 2 }}
        >
          <Button
            onClick={handleCloseDialog}
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
            disabled={loading}
          >
            {loading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(deletePopover.anchorEl)}
        anchorEl={deletePopover.anchorEl}
        onClose={handleCloseDeletePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this document?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button onClick={handleCloseDeletePopover} variant="outlined">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
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

export default Documents;
