"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import EmployeeLevelFormPopup from "@/components/dashboard/employee-level-create-form/EmployeeLevelForm";
import { BASE_URL } from "@/services/baseUrl";

const EmployeeLevels = () => {
  const [employeeLevels, setEmployeeLevels] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [employeeLevelToDelete, setEmployeeLevelToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editEmployeeLevel, setEditEmployeeLevel] = useState(null);

  const columns = [
    { field: "name", headerName: "Level Name", width: 200 },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit employee level"
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
          aria-label="Delete employee level"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditEmployeeLevel(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (employeeLevel) => {
    setEditEmployeeLevel(employeeLevel);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditEmployeeLevel(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditEmployeeLevel(null);
    fetchEmployeeLevels(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, employeeLevel) => {
    setAnchorEl(event.currentTarget);
    setEmployeeLevelToDelete(employeeLevel);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setEmployeeLevelToDelete(null);
  };

  const handleDeleteEmployeeLevel = async () => {
    if (!employeeLevelToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/employee-level/delete/${employeeLevelToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete employee level");
      }

      const data = await response.json();
      toast.success(data.message || "Employee level deleted successfully!", {
        position: "top-right",
      });

      await fetchEmployeeLevels(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete employee level:", error);
      setFetchError(
        error.message || "Failed to delete employee level. Please try again."
      );
      toast.error(error.message || "Failed to delete employee level.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeLevels = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/employee-level/list?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employee levels");
      }

      const data = await response.json();
      const employeeLevels = (data.data?.employeeLevels || [])
        .filter((level) => level && typeof level === "object" && level.id)
        .map((level) => ({
          ...level,
          name: level.name || "-",
        }));

      if (employeeLevels.length !== data.data?.employeeLevels?.length) {
        console.warn(
          "Filtered out invalid employee level entries:",
          data.data?.employeeLevels
        );
      }

      setEmployeeLevels(employeeLevels);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch employee levels:", error);
      setFetchError("Failed to load employee levels. Please try again.");
      setEmployeeLevels([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeLevels(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No employee levels found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Employee Levels ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Employee Level</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" height={50} width={5} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <input
              type="text"
              placeholder="Search Employee Levels"
              value={searchQuery}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
            />
          </div>

          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={employeeLevels}
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
                  showrowsperpage: false.toString(),
                },
              }}
            />
          </Paper>
        </>
      )}

      <EmployeeLevelFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        employeeLevel={editEmployeeLevel}
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
            <strong>{employeeLevelToDelete?.name}</strong>?
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
              onClick={handleDeleteEmployeeLevel}
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

export default EmployeeLevels;
