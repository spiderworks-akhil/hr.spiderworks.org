"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper, Grid } from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";

// Dynamically import StarRatingFormPopup with SSR disabled
const StarRatingFormPopup = dynamic(
  () =>
    import(
      "@/components/dashboard/employee-star-rating-form/StarRatingFormPopup"
    ),
  { ssr: false }
);

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "40px",
    boxShadow: "none",
    "&:hover": { border: "1px solid #ccc" },
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#2ac4ab"
      : state.isFocused
      ? "#e6f7f5"
      : "white",
    color: state.isSelected ? "white" : "black",
    "&:hover": { backgroundColor: state.isSelected ? "#2ac4ab" : "#e6f7f5" },
  }),
};

const StarRatings = () => {
  const [starRatings, setStarRatings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [givenById, setGivenById] = useState(null);
  const [givenToId, setGivenToId] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [starCount, setStarCount] = useState(null);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [ratingToDelete, setRatingToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editRating, setEditRating] = useState(null);

  const columns = [
    { field: "label", headerName: "Label", width: 200 },
    {
      field: "given_by",
      headerName: "Given By",
      width: 150,
      renderCell: (params) => (
        <>
          {params.row.given_by?.name && params.row.given_by.name.trim() !== ""
            ? params.row.given_by.name
            : "-"}
        </>
      ),
    },
    {
      field: "given_to",
      headerName: "Given To",
      width: 150,
      renderCell: (params) => (
        <>
          {params.row.given_to?.name && params.row.given_to.name.trim() !== ""
            ? params.row.given_to.name
            : "-"}
        </>
      ),
    },
    {
      field: "star_type",
      headerName: "Star Type",
      width: 100,
      renderCell: (params) => (
        <span
          className={`px-2 py-1 rounded text-white ${
            params.value?.toLowerCase() === "green"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {params.value
            ? params.value.charAt(0).toUpperCase() + params.value.slice(1)
            : "-"}
        </span>
      ),
    },
    {
      field: "star_count",
      headerName: "Stars",
      width: 150,
      renderCell: (params) => (
        <div className="flex">
          {[...Array(5)].map((_, index) => (
            <FaStar
              key={index}
              className={`w-4 h-4 mt-2 ${
                index < params.value
                  ? params.row.star_type?.toLowerCase() === "green"
                    ? "text-green-500"
                    : "text-red-500"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 150,
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
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit star rating"
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
          aria-label="Delete star rating"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const employeeOptions = [
    { value: null, label: "All Employees" },
    ...employees.map((employee) => ({
      value: employee.id,
      label: employee.name,
    })),
  ];

  const starCountOptions = [
    { value: null, label: "All Stars" },
    { value: 1, label: "1 Star" },
    { value: 2, label: "2 Stars" },
    { value: 3, label: "3 Stars" },
    { value: 4, label: "4 Stars" },
    { value: 5, label: "5 Stars" },
  ];

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/list`);
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setEmployees(data.data?.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees.", { position: "top-right" });
    }
  };

  const fetchStarRatings = async (pageNum, filters = {}) => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        ...(filters.employeeId && {
          employeeId: filters.employeeId.toString(),
        }),
        ...(filters.givenById &&
          !filters.employeeId && { given_by_id: filters.givenById.toString() }),
        ...(filters.givenToId &&
          !filters.employeeId && { given_to_id: filters.givenToId.toString() }),
        ...(filters.starCount && { star_count: filters.starCount.toString() }),
        ...(filters.from && {
          from: moment(filters.from).format("YYYY-MM-DD"),
        }),
        ...(filters.to && { to: moment(filters.to).format("YYYY-MM-DD") }),
      }).toString();

      const response = await fetch(`${BASE_URL}/api/star-rating/list?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch star ratings");
      }

      const data = await response.json();
      const ratings = (data.data?.starRatings || [])
        .filter((rating) => {
          if (!rating || typeof rating !== "object" || !rating.id) {
            console.warn("Invalid star rating entry:", rating);
            return false;
          }
          return true;
        })
        .map((rating) => ({
          ...rating,
          given_by: rating.givenBy || null,
          given_to: rating.givenTo || null,
          star_type: rating.star_type || null,
          star_count: rating.star_count || 0,
          created_at: rating.created_at || null,
        }));

      setStarRatings(ratings);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch star ratings:", error);
      setFetchError("Failed to load star ratings. Please try again.");
      setStarRatings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const filters = {
      employeeId,
      givenById,
      givenToId,
      starCount,
      from: fromDate,
      to: toDate,
    };
    fetchStarRatings(page, filters);
  }, [page, employeeId, givenById, givenToId, starCount, fromDate, toDate]);

  const handleEmployeeFilterChange = (selected) => {
    setEmployeeId(selected ? selected.value : null);
    setGivenById(null);
    setGivenToId(null);
    setPage(0);
  };

  const handleGivenByChange = (selected) => {
    setGivenById(selected ? selected.value : null);
    setEmployeeId(null);
    setPage(0);
  };

  const handleGivenToChange = (selected) => {
    setGivenToId(selected ? selected.value : null);
    setEmployeeId(null);
    setPage(0);
  };

  const handleStarCountChange = (selected) => {
    setStarCount(selected ? selected.value : null);
    setPage(0);
  };

  const handleOpenAddDialog = () => {
    setEditRating(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (rating) => {
    setEditRating(rating);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditRating(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditRating(null);
    fetchStarRatings(page, {
      employeeId,
      givenById,
      givenToId,
      starCount,
      from: fromDate,
      to: toDate,
    });
  };

  const handleOpenDeletePopover = (event, rating) => {
    setAnchorEl(event.currentTarget);
    setRatingToDelete(rating);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setRatingToDelete(null);
  };

  const handleDeleteStarRating = async () => {
    if (!ratingToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/star-rating/delete/${ratingToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete star rating");
      }

      const data = await response.json();
      toast.success(data.message || "Star rating deleted successfully!", {
        position: "top-right",
      });

      await fetchStarRatings(page, {
        employeeId,
        givenById,
        givenToId,
        starCount,
        from: fromDate,
        to: toDate,
      });
    } catch (error) {
      console.error("Failed to delete star rating:", error);
      setFetchError(
        error.message || "Failed to delete star rating. Please try again."
      );
      toast.error(error.message || "Failed to delete star rating.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No star ratings found
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="min-h-screen bg-white p-4">
        <Toaster position="top-right" reverseOrder={true} />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Star Ratings ({total})
          </h1>
          <button
            onClick={handleOpenAddDialog}
            className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <span>+ Add Star Rating</span>
          </button>
        </div>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={2}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Filter by Employee
            </label>
            <Select
              options={employeeOptions}
              value={
                employeeOptions.find((opt) => opt.value === employeeId) || null
              }
              onChange={handleEmployeeFilterChange}
              styles={customSelectStyles}
              placeholder="Filter by Employee..."
              isClearable
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Given By
            </label>
            <Select
              options={employeeOptions}
              value={
                employeeOptions.find((opt) => opt.value === givenById) || null
              }
              onChange={handleGivenByChange}
              styles={customSelectStyles}
              placeholder="Given By..."
              isClearable
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Given To
            </label>
            <Select
              options={employeeOptions}
              value={
                employeeOptions.find((opt) => opt.value === givenToId) || null
              }
              onChange={handleGivenToChange}
              styles={customSelectStyles}
              placeholder="Given To..."
              isClearable
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Star Count
            </label>
            <Select
              options={starCountOptions}
              value={
                starCountOptions.find((opt) => opt.value === starCount) || null
              }
              onChange={handleStarCountChange}
              styles={customSelectStyles}
              placeholder="Star Count..."
              isClearable
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              From Date
            </label>
            <DesktopDatePicker
              format="DD-MM-YYYY"
              value={fromDate ? moment(fromDate) : null}
              onChange={(newValue) => {
                setFromDate(newValue ? newValue.toDate() : null);
                setPage(0);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  placeholder: "From Date",
                  InputProps: { style: { height: "40px" } },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              To Date
            </label>
            <DesktopDatePicker
              format="DD-MM-YYYY"
              value={toDate ? moment(toDate) : null}
              onChange={(newValue) => {
                setToDate(newValue ? newValue.toDate() : null);
                setPage(0);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  placeholder: "To Date",
                  InputProps: { style: { height: "40px" } },
                },
              }}
            />
          </Grid>
        </Grid>

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
                rows={starRatings}
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
                    "&:hover": { backgroundColor: "rgba(234, 248, 244, 1)" },
                  },
                  "& .MuiDataGrid-cell": { border: "none" },
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
                slots={{ noRowsOverlay: CustomNoRowsOverlay }}
                slotProps={{ pagination: { showRowsPerPage: false } }}
              />
            </Paper>
          </>
        )}

        <StarRatingFormPopup
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
          starRating={editRating}
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
              <strong>{ratingToDelete?.label}</strong>?
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
                onClick={handleDeleteStarRating}
                disabled={loading}
              >
                {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
              </Button>
            </Box>
          </Box>
        </Popover>
      </div>
    </LocalizationProvider>
  );
};

export default StarRatings;
