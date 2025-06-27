"use client";

import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Modal,
  Box,
  TextField,
  Typography,
  Popover,
  Paper,
} from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { BASE_URL } from "@/services/baseUrl";

const MAX_FILE_SIZE_5MB = 5 * 1024 * 1024; // 5MB in bytes

const EmployeePhotos = ({ employee }) => {
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [typeError, setTypeError] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formData, setFormData] = useState({
    id: 0,
    type: "",
    photo: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    photoId: null,
  });

  const photoTypeOptions = [
    { value: "Selfie", label: "Selfie" },
    { value: "Family", label: "Family" },
  ];

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: "4px",
      borderColor: state.isFocused
        ? "rgb(42,196,171)"
        : state.isHovered
        ? "rgba(42,196,171, 0.5)"
        : "rgba(0, 0, 0, 0.2)",
      boxShadow: state.isFocused ? "0 0 0 1px rgb(42,196,171)" : "none",
      padding: "2px 4px",
      backgroundColor: "white",
      "&:hover": {
        borderColor: state.isFocused
          ? "rgb(42,196,171)"
          : "rgba(42,196,171, 0.5)",
      },
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "4px",
      marginTop: "4px",
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
  };

  const fetchPhotos = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-photos/list/${employee.id}?page=${
          page + 1
        }&limit=3${search ? `&keyword=${encodeURIComponent(search)}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch photos");
      }
      const data = await response.json();
      setPhotos(data.data?.photos || []);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch photos:", error);
      setFetchError(
        error.message || "Failed to load photos. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenModal = (mode, photo = null) => {
    setModalMode(mode);
    if (mode === "edit" && photo) {
      setFormData({
        id: photo.id,
        type: photo.type,
        photo: null,
      });
    } else {
      setFormData({
        id: 0,
        type: "",
        photo: null,
      });
    }
    setTypeError(null);
    setPhotoError(null);
    setFormError(null);
    setApiError(null);
    setSubmitted(false);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setFormData({
      id: 0,
      type: "",
      photo: null,
    });
    setTypeError(null);
    setPhotoError(null);
    setFormError(null);
    setApiError(null);
    setSubmitted(false);
  };

  const handleInputChange = (selectedOption) => {
    setFormData({
      ...formData,
      type: selectedOption ? selectedOption.value : "",
    });
    if (selectedOption && typeError) {
      setTypeError(null);
    }
    if (selectedOption && formError) {
      setFormError(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file && modalMode === "add") {
      setPhotoError("Photo is required");
    }
    if (!file && modalMode === "edit") {
      setPhotoError("");
    }
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setPhotoError("Only JPG, JPEG, PNG, and WebP files are allowed");
        setFormData({ ...formData, photo: file });
        setFormError(null);
        return;
      }
      if (file.size > MAX_FILE_SIZE_5MB) {
        setPhotoError("Image size must not exceed 5 MB");
        setFormData({ ...formData, photo: file });
        setFormError(null);
        return;
      }
      setFormData({ ...formData, photo: file });
      if (photoError) {
        setPhotoError(null);
      }
      if (formError) {
        setFormError(null);
      }
    } else {
      setFormData({ ...formData, photo: null });
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    let hasError = false;

    if (modalMode === "add") {
      if (!formData.type) {
        setTypeError("Photo type is required");
        hasError = true;
      }
      if (!formData.photo) {
        setPhotoError("Photo is required");
        hasError = true;
      } else if (formData.photo.size > MAX_FILE_SIZE_5MB) {
        setPhotoError("Image size must not exceed 5 MB");
        hasError = true;
      }
    }

    if (modalMode === "edit") {
      if (!formData.type && !formData.photo) {
        setFormError("At least one of photo type or photo file is required");
        hasError = true;
      } else if (formData.photo && formData.photo.size > MAX_FILE_SIZE_5MB) {
        setPhotoError("Image size must not exceed 5 MB");
        hasError = true;
      }
    }

    if (hasError) return;

    const payload = new FormData();
    if (formData.type) {
      payload.append("type", formData.type);
    }
    payload.append("employee_id", employee.id.toString());
    if (formData.photo) {
      payload.append("photo", formData.photo);
    }

    try {
      setLoading(true);
      setTypeError(null);
      setPhotoError(null);
      setFormError(null);
      setApiError(null);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-photos/create`
          : `${BASE_URL}/api/employee-photos/update/${formData.id}`;
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
            `Failed to ${modalMode === "add" ? "create" : "update"} photo`
        );
      }

      toast.success(data.message || "Photo saved successfully!", {
        position: "top-right",
      });

      await fetchPhotos(page, searchQuery);
      handleCloseModal();
    } catch (error) {
      console.error(
        `Failed to ${modalMode === "add" ? "create" : "update"} photo:`,
        error
      );
      setApiError(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } photo. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeletePopover = (event, photoId) => {
    setDeletePopover({ anchorEl: event.currentTarget, photoId });
  };

  const handleCloseDeletePopover = () => {
    setDeletePopover({ anchorEl: null, photoId: null });
  };

  const handleDelete = async () => {
    if (!deletePopover.photoId) return;

    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-photos/delete/${deletePopover.photoId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      toast.success(data.message || "Photo deleted successfully!", {
        position: "top-right",
      });

      await fetchPhotos(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete photo:", error);
      setFetchError(
        error.message || "Failed to delete photo. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>No photos found</Box>
  );

  const columns = [
    { field: "type", headerName: "Photo Type", width: 150 },
    {
      field: "photo",
      headerName: "Photo",
      width: 200,
      renderCell: (params) => (
        <PhotoProvider bannerVisible={false} maskOpacity={0.5}>
          <PhotoView src={`${BASE_URL}/${params.value}`}>
            <img
              src={`${BASE_URL}/${params.value}`}
              alt="Employee Photo"
              style={{
                width: "100px",
                height: "auto",
                objectFit: "cover",
                cursor: "pointer",
              }}
            />
          </PhotoView>
        </PhotoProvider>
      ),
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
          onClick={() => handleOpenModal("edit", params.row)}
          aria-label="Edit photo"
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
          aria-label="Delete photo"
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
          placeholder="Search Photos"
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
          Add Photo
        </Button>
      </Box>
      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <BeatLoader color="rgb(42,196,171)" size={12} />
          </Box>
        ) : (
          <DataGrid
            rows={photos}
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

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "white",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            {modalMode === "add" ? "Add Photo" : "Edit Photo"}
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Select
              options={photoTypeOptions}
              value={
                photoTypeOptions.find(
                  (option) => option.value === formData.type
                ) || null
              }
              onChange={handleInputChange}
              placeholder="Select Photo Type"
              styles={customSelectStyles}
              isClearable
            />
            {typeError && (
              <Typography
                color="error"
                variant="caption"
                sx={{ fontSize: "0.75rem", color: "red" }}
              >
                {typeError}
              </Typography>
            )}
          </Box>
          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "block", width: "100%" }}
            />
            {photoError && (
              <Typography
                color="error"
                variant="caption"
                sx={{ fontSize: "0.75rem", color: "red" }}
              >
                {photoError}
              </Typography>
            )}
          </Box>
          {(formError || apiError) && (
            <Typography color="error" sx={{ mb: 2 }}>
              {formError || apiError}
            </Typography>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              onClick={handleCloseModal}
              sx={{
                backgroundColor: "#ffebee",
                color: "#ef5350",
                "&:hover": { backgroundColor: "#ffcdd2" },
                padding: "8px 16px",
                borderRadius: "8px",
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: "rgb(42,196,171)",
                "&:hover": { backgroundColor: "rgb(35,170,148)" },
              }}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
            </Button>
          </Box>
        </Box>
      </Modal>

      <Popover
        open={Boolean(deletePopover.anchorEl)}
        anchorEl={deletePopover.anchorEl}
        onClose={handleCloseDeletePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this photo?
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

export default EmployeePhotos;
