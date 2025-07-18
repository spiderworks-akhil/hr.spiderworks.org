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
import { MdEdit, MdDelete } from "react-icons/md";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const EmployeeSkillHobbies = ({ employee }) => {
  const [skillHobbies, setSkillHobbies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({ id: 0, title: "", expertise: "" });
  const [submitted, setSubmitted] = useState(false);
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    skillHobbyId: null,
  });

  const { data: session, status: sessionStatus } = useSession();

  const expertiseOptions = [
    { value: "Hobby", label: "Hobby" },
    { value: "Learning", label: "Learning" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Professional", label: "Professional" },
    { value: "Master", label: "Master" },
  ];

  const fetchSkillHobbies = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-skill-hobby/list/${employee.id}?page=${
          page + 1
        }&limit=100${search ? `&keyword=${encodeURIComponent(search)}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch skill/hobbies");
      }
      const data = await response.json();
      setSkillHobbies(data.data?.skillHobbies || []);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch skill/hobbies:", error);
      setFetchError(
        error.message || "Failed to load skill/hobbies. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillHobbies(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (mode, skillHobby = null) => {
    setModalMode(mode);
    if (mode === "edit" && skillHobby) {
      setFormData({
        id: skillHobby.id,
        title: skillHobby.title,
        expertise: skillHobby.expertise,
      });
    } else {
      setFormData({ id: 0, title: "", expertise: "" });
    }
    setModalError(null);
    setApiError(null);
    setSubmitted(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ id: 0, title: "", expertise: "" });
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

  const handleExpertiseChange = (selectedOption) => {
    setFormData({
      ...formData,
      expertise: selectedOption ? selectedOption.value : "",
    });
    if (selectedOption && modalError && modalError.includes("expertise")) {
      setModalError(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!formData.title) {
      setModalError("Title is required");
      return;
    }
    if (!formData.expertise) {
      setModalError("Expertise is required");
      return;
    }

    const userId = session?.user?.id;
    const payload = {
      title: formData.title,
      expertise: formData.expertise,
      employee_id: employee.id,
      ...(modalMode === "add"
        ? { created_by: userId, updated_by: userId }
        : { updated_by: userId }),
    };

    try {
      setLoading(true);
      setModalError(null);
      setApiError(null);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-skill-hobby/create`
          : `${BASE_URL}/api/employee-skill-hobby/update/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

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
            `Failed to ${modalMode === "add" ? "create" : "update"} skill/hobby`
        );
      }

      await fetchSkillHobbies(page, searchQuery);
      handleCloseDialog();
    } catch (error) {
      console.error(
        `Failed to ${modalMode === "add" ? "create" : "update"} skill/hobby:`,
        error
      );
      setApiError(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } skill/hobby. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeletePopover = (event, skillHobbyId) => {
    setDeletePopover({ anchorEl: event.currentTarget, skillHobbyId });
  };

  const handleCloseDeletePopover = () => {
    setDeletePopover({ anchorEl: null, skillHobbyId: null });
  };

  const handleDelete = async () => {
    if (!deletePopover.skillHobbyId) return;

    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-skill-hobby/delete/${deletePopover.skillHobbyId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete skill/hobby");
      }
      await fetchSkillHobbies(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete skill/hobby:", error);
      setFetchError(
        error.message || "Failed to delete skill/hobby. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No skills or hobbies found
    </Box>
  );

  const columns = [
    { field: "title", headerName: "Title", width: 200 },
    { field: "expertise", headerName: "Expertise", width: 200 },
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
          aria-label="Edit skill/hobby"
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
          aria-label="Delete skill/hobby"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
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
          placeholder="Search Skills/Hobbies"
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
          disabled={sessionStatus !== "authenticated"}
        >
          Add Skill/Hobby
        </Button>
      </Box>
      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <BeatLoader color="rgb(42,196,171)" size={12} />
          </Box>
        ) : (
          <DataGrid
            rows={skillHobbies}
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
          {modalMode === "add" ? "Add Skill/Hobby" : "Edit Skill/Hobby"}
        </DialogTitle>
        <DialogContent className="overflow-y-auto">
          {apiError && (
            <Typography color="error" sx={{ mb: 2, fontSize: "0.75rem" }}>
              {apiError}
            </Typography>
          )}
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <Box>
              <label className="block mb-1 text-md">Title *</label>
              <TextField
                fullWidth
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                size="small"
                error={submitted && !formData.title}
                helperText={
                  submitted && !formData.title ? "Title is required" : ""
                }
                className="bg-white"
              />
            </Box>
            <Box>
              <label className="block mb-1 text-md">Expertise *</label>
              <Select
                options={expertiseOptions}
                value={
                  expertiseOptions.find(
                    (option) => option.value === formData.expertise
                  ) || null
                }
                onChange={handleExpertiseChange}
                placeholder="Select Expertise"
                isSearchable
                isClearable
                styles={{
                  control: (provided, state) => ({
                    ...provided,
                    borderRadius: "4px",
                    padding: "2px 4px",
                    backgroundColor: "white",
                    borderColor: state.isFocused
                      ? "rgb(42,196,171)"
                      : state.isHovered
                      ? "rgba(42,196,171, 0.5)"
                      : "rgba(0, 0, 0, 0.2)",
                    boxShadow: state.isFocused
                      ? "0 0 0 1px rgb(42,196,171)"
                      : "none",
                    "&:hover": {
                      borderColor: state.isFocused
                        ? "rgb(42,196,171)"
                        : "rgba(42,196,171, 0.5)",
                    },
                    minHeight: "36px",
                  }),
                  menu: (provided) => ({
                    ...provided,
                    borderRadius: "4px",
                    marginTop: "4px",
                    zIndex: 9999,
                  }),
                  option: (provided, state) => ({
                    ...provided,
                    backgroundColor: state.isSelected
                      ? "#2ac4ab"
                      : state.isFocused
                      ? "rgba(42,196,171, 0.05)"
                      : "white",
                    color: state.isSelected ? "white" : "black",
                    "&:hover": {
                      backgroundColor: state.isSelected
                        ? "#2ac4ab"
                        : "rgba(42,196,171, 0.05)",
                    },
                  }),
                  singleValue: (provided) => ({
                    ...provided,
                    color: "black",
                  }),
                  placeholder: (provided) => ({
                    ...provided,
                    color: "rgba(0, 0, 0, 0.6)",
                  }),
                }}
              />
              {submitted && !formData.expertise && (
                <Typography
                  color="error"
                  variant="caption"
                  sx={{ fontSize: "0.75rem" }}
                >
                  Expertise is required
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
            disabled={loading || sessionStatus !== "authenticated"}
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
            Are you sure you want to delete this skill/hobby?
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

export default EmployeeSkillHobbies;
