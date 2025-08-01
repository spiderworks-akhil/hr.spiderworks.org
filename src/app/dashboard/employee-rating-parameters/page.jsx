"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import RatingParameterFormPopup from "@/components/dashboard/rating-parameter-form/RatingParameterForm";
import { BASE_URL } from "@/services/baseUrl";

const EmployeeRatingParameters = () => {
  const [parameters, setParameters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [parameterToDelete, setParameterToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editParameter, setEditParameter] = useState(null);

  const columns = [
    { field: "name", headerName: "Parameter Name", width: 200 },
    { field: "description", headerName: "Description", width: 300 },
    {
      field: "ratable_by_client",
      headerName: "Client Ratable",
      width: 120,
      renderCell: (params) => (params.value ? "Yes" : "No"),
    },
    {
      field: "ratable_by_manager",
      headerName: "Manager Ratable",
      width: 120,
      renderCell: (params) => (params.value ? "Yes" : "No"),
    },
    {
      field: "ratable_by_self",
      headerName: "Self Ratable",
      width: 120,
      renderCell: (params) => (params.value ? "Yes" : "No"),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit parameter"
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
          aria-label="Delete parameter"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditParameter(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (parameter) => {
    setEditParameter(parameter);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditParameter(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditParameter(null);
    fetchParameters(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, parameter) => {
    setAnchorEl(event.currentTarget);
    setParameterToDelete(parameter);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setParameterToDelete(null);
  };

  const handleDeleteParameter = async () => {
    if (!parameterToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/employee-rating-parameter/delete/${parameterToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete parameter");
      }

      const data = await response.json();
      toast.success(data.message || "Parameter deleted successfully!", {
        position: "top-right",
      });

      await fetchParameters(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete parameter:", error);
      setFetchError(
        error.message || "Failed to delete parameter. Please try again."
      );
      toast.error(error.message || "Failed to delete parameter.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchParameters = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/employee-rating-parameter/list?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch parameters");
      }

      const data = await response.json();
      const parameters = (data.data?.employeeRatingParameters || [])
        .filter((param) => param && typeof param === "object" && param.id)
        .map((param) => ({
          ...param,
          name: param.name || "-",
          description: param.description || "-",
          ratable_by_client: param.ratable_by_client || 0,
          ratable_by_manager: param.ratable_by_manager || 0,
          ratable_by_self: param.ratable_by_self || 0,
        }));

      if (parameters.length !== data.data?.employeeRatingParameters?.length) {
        console.warn(
          "Filtered out invalid parameter entries:",
          data.data?.employeeRatingParameters
        );
      }

      setParameters(parameters);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch parameters:", error);
      setFetchError("Failed to load parameters. Please try again.");
      setParameters([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No parameters found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Rating Parameters ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Parameter</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Parameters"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" height={50} width={5} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <>
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={parameters}
              columns={columns}
              autoHeight
              initialState={{
                pagination: { paginationModel: { page, pageSize: limit } },
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
          </Paper>
        </>
      )}

      <RatingParameterFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        parameter={editParameter}
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
            <strong>{parameterToDelete?.name}</strong>?
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
              onClick={handleDeleteParameter}
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

export default EmployeeRatingParameters;
