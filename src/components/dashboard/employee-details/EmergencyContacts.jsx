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

const EmployeeEmergencyContacts = ({ employee }) => {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    id: 0,
    contact_name: "",
    phone_number: "",
    relationship: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    contactId: null,
  });

  const phoneRegex = /^\+?[\d\s-]{7,15}$/;

  const fetchEmergencyContacts = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-emergency-contact/list/${employee.id}?page=${
          page + 1
        }&limit=3${search ? `&keyword=${encodeURIComponent(search)}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch emergency contacts");
      }
      const data = await response.json();
      setEmergencyContacts(data.data?.emergencyContacts || []);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch emergency contacts:", error);
      setFetchError(
        error.message || "Failed to load emergency contacts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencyContacts(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenModal = (mode, contact = null) => {
    setModalMode(mode);
    if (mode === "edit" && contact) {
      setFormData({
        id: contact.id,
        contact_name: contact.contact_name,
        phone_number: contact.phone_number,
        relationship: contact.relationship,
      });
    } else {
      setFormData({
        id: 0,
        contact_name: "",
        phone_number: "",
        relationship: "",
      });
    }
    setModalError(null);
    setApiError(null);
    setSubmitted(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      id: 0,
      contact_name: "",
      phone_number: "",
      relationship: "",
    });
    setModalError(null);
    setApiError(null);
    setSubmitted(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value && modalError && modalError.includes(name)) {
      setModalError(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!formData.contact_name) {
      setModalError("Contact name is required");
      return;
    }
    if (!formData.phone_number) {
      setModalError("Phone number is required");
      return;
    }
    if (!phoneRegex.test(formData.phone_number)) {
      setModalError(
        "Please enter a valid phone number (7-15 digits, optional + prefix, spaces, or dashes)"
      );
      return;
    }
    if (!formData.relationship) {
      setModalError("Relationship is required");
      return;
    }

    const payload = {
      contact_name: formData.contact_name,
      phone_number: formData.phone_number,
      relationship: formData.relationship,
      employee_id: employee.id,
    };

    try {
      setLoading(true);
      setModalError(null);
      setApiError(null);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-emergency-contact/create`
          : `${BASE_URL}/api/employee-emergency-contact/update/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Unknown error occurred";
        if (errorData.data?.message) {
          errorMessage = Array.isArray(errorData.data.message)
            ? errorData.data.message.join(", ")
            : String(errorData.data.message);
        }
        throw new Error(
          errorMessage ||
            `Failed to ${
              modalMode === "add" ? "create" : "update"
            } emergency contact`
        );
      }

      toast.success(data.message || "Emergency contact saved successfully!", {
        position: "top-right",
      });

      await fetchEmergencyContacts(page, searchQuery);
      handleCloseModal();
    } catch (error) {
      console.error(
        `Failed to ${
          modalMode === "add" ? "create" : "update"
        } emergency contact:`,
        error
      );
      setApiError(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } emergency contact. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeletePopover = (event, contactId) => {
    setDeletePopover({ anchorEl: event.currentTarget, contactId });
  };

  const handleCloseDeletePopover = () => {
    setDeletePopover({ anchorEl: null, contactId: null });
  };

  const handleDelete = async () => {
    if (!deletePopover.contactId) return;

    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-emergency-contact/delete/${deletePopover.contactId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to delete emergency contact");
      }

      toast.success(data.message || "Emergency contact deleted successfully!", {
        position: "top-right",
      });

      await fetchEmergencyContacts(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete emergency contact:", error);
      setFetchError(
        error.message || "Failed to delete emergency contact. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No emergency contacts found
    </Box>
  );

  const columns = [
    { field: "contact_name", headerName: "Contact Name", width: 200 },
    { field: "phone_number", headerName: "Phone Number", width: 150 },
    { field: "relationship", headerName: "Relationship", width: 150 },
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
          onClick={() => handleOpenModal("edit", params.row)}
          aria-label="Edit emergency contact"
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
          aria-label="Delete emergency contact"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" reverseOutletModalrder={true} />
      {fetchError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {fetchError}
        </Typography>
      )}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}
        Sensible
      >
        <TextField
          variant="outlined"
          placeholder="Search Emergency Contacts"
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
        >
          Add Emergency Contact
        </Button>
      </Box>
      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <BeatLoader color="rgb(42,196,171)" size={12} />
          </Box>
        ) : (
          <DataGrid
            rows={emergencyContacts}
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
          {modalMode === "add"
            ? "Add Emergency Contact"
            : "Edit Emergency Contact"}
        </DialogTitle>
        <DialogContent className="overflow-y-auto">
          {apiError && <Box className="text-red-600 mb-4">{apiError}</Box>}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box>
              <label className="block mb-1 text-md">Contact Name *</label>
              <TextField
                fullWidth
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                error={submitted && !formData.contact_name}
                helperText={
                  submitted && !formData.contact_name
                    ? "Contact name is required"
                    : ""
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
            <Box>
              <label className="block mb-1 text-md">Phone Number *</label>
              <TextField
                fullWidth
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                error={
                  submitted &&
                  (!formData.phone_number ||
                    !phoneRegex.test(formData.phone_number))
                }
                helperText={
                  submitted && !formData.phone_number
                    ? "Phone number is required"
                    : submitted && !phoneRegex.test(formData.phone_number)
                    ? "Please enter a valid phone number (7–15 digits, optional + prefix, spaces, or dashes)"
                    : ""
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
            <Box>
              <label className="block mb-1 text-md">Relationship *</label>
              <TextField
                fullWidth
                name="relationship"
                value={formData.relationship}
                onChange={handleInputChange}
                error={submitted && !formData.relationship}
                helperText={
                  submitted && !formData.relationship
                    ? "Relationship is required"
                    : ""
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
        <DialogActions
          sx={{ justifyContent: "space-between", px: 3, pb: 3, pt: 2 }}
        >
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
            Are you sure you want to delete this emergency contact?
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

export default EmployeeEmergencyContacts;
