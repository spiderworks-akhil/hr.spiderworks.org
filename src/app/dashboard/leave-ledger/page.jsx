"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";

const LeaveLedgerFormPopup = dynamic(
  () => import("@/components/dashboard/leave-ledger-form/LeaveLedgerFormPopup"),
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

const LeaveLedger = () => {
  const [leaveLedgers, setLeaveLedgers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [employeeId, setEmployeeId] = useState(null);
  const [leaveType, setLeaveType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [leaveLedgerToDelete, setLeaveLedgerToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editLeaveLedger, setEditLeaveLedger] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const leaveTypeOptions = [
    { value: "CASUAL_LEAVE", label: "Casual Leave" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "COMPENSATORY_LEAVE", label: "Compensatory Leave" },
    { value: "SPECIAL_LEAVE", label: "Special Leave" },
  ];

  const columns = [
    {
      field: "employee",
      headerName: "Employee",
      width: 150,
      renderCell: (params) => <span>{params.value?.name || "-"}</span>,
    },
    {
      field: "leave_type",
      headerName: "Leave Type",
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value
            ? params.value
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "-"}
        </span>
      ),
    },
    {
      field: "count",
      headerName: "Count",
      width: 100,
      renderCell: (params) => <span>{params.value ?? "-"}</span>,
    },
    {
      field: "eligibility_date",
      headerName: "Eligibility Date",
      width: 120,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "remarks",
      headerName: "Remarks",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit leave ledger"
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
          aria-label="Delete leave ledger"
          className="p-1"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditLeaveLedger(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (leaveLedger) => {
    setEditLeaveLedger(leaveLedger);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditLeaveLedger(null);
  };

  const handleOpenDeletePopover = (event, leaveLedger) => {
    setAnchorEl(event.currentTarget);
    setLeaveLedgerToDelete(leaveLedger);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setLeaveLedgerToDelete(null);
  };

  const handleDeleteLeaveLedger = async () => {
    if (!leaveLedgerToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/leave-ledger/delete/${leaveLedgerToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete leave ledger");
      }

      const data = await response.json();
      toast.success(data.message || "Leave ledger deleted successfully!", {
        position: "top-right",
      });

      await fetchLeaveLedgers();
    } catch (error) {
      console.error("Failed to delete leave ledger:", error);
      setFetchError(
        error.message || "Failed to delete leave ledger. Please try again."
      );
      toast.error(error.message || "Failed to delete leave ledger.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveLedgers = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(employeeId && { employeeId: employeeId.toString() }),
        ...(leaveType && { leave_type: leaveType }),
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/leave-ledger/list?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leave ledgers");
      }

      const data = await response.json();
      const records = (data.data?.leaveLedgers || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid leave ledger entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          employee: record.employee || null,
          leave_type: record.leave_type || null,
          count: record.count || null,
          eligibility_date: record.eligibility_date || null,
          remarks: record.remarks || null,
          leave_application_id: record.leave_application_id || null,
          createdBy: record.createdBy || null,
          updatedBy: record.updatedBy || null,
        }));

      setLeaveLedgers(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch leave ledgers:", error);
      setFetchError("Failed to load leave ledgers. Please try again.");
      setLeaveLedgers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/employees/list`);
        if (!response.ok) {
          throw new Error("Failed to fetch employees");
        }
        const data = await response.json();
        const options = data.data?.employees.map((emp) => ({
          value: emp.id,
          label: emp.name,
        }));
        setEmployeeOptions(options);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error("Failed to load employees.", { position: "top-right" });
      }
    };

    fetchEmployees();
    fetchLeaveLedgers();
  }, [page, employeeId, leaveType]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    if (field === "employeeId") {
      setEmployeeId(value);
    } else if (field === "leaveType") {
      setLeaveType(value);
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditLeaveLedger(null);
    fetchLeaveLedgers();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No leave ledger entries found
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="min-h-screen bg-white p-4">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Leave Ledger ({total})
          </h1>
          <Button
            onClick={handleOpenAddDialog}
            sx={{
              backgroundColor: "rgb(42,196,171)",
              color: "white",
              "&:hover": { backgroundColor: "rgb(36,170,148)" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
          >
            + Add Leave Ledger
          </Button>
        </div>

        <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
          <Box width={{ xs: "100%", sm: "200px" }}>
            <label className="block mb-1">Employee</label>
            <Select
              options={employeeOptions}
              value={
                employeeOptions.find((opt) => opt.value === employeeId) || null
              }
              onChange={(selected) =>
                handleFilterChange(
                  "employeeId",
                  selected ? selected.value : null
                )
              }
              styles={customSelectStyles}
              placeholder="Employee..."
              isClearable
            />
          </Box>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <label className="block mb-1">Leave Type</label>
            <Select
              options={leaveTypeOptions}
              value={
                leaveTypeOptions.find((opt) => opt.value === leaveType) || null
              }
              onChange={(selected) =>
                handleFilterChange(
                  "leaveType",
                  selected ? selected.value : null
                )
              }
              styles={customSelectStyles}
              placeholder="Leave Type..."
              isClearable
            />
          </Box>
        </Box>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="64"
          >
            <BeatLoader color="#2ac4ab" size={15} />
          </Box>
        ) : fetchError ? (
          <Box textAlign="center" color="red" py={10}>
            {fetchError}
          </Box>
        ) : (
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={leaveLedgers}
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
                  showrowsperpage: "false",
                },
              }}
            />
          </Paper>
        )}

        <LeaveLedgerFormPopup
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
          leaveLedger={editLeaveLedger}
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
              Are you sure you want to delete leave ledger for{" "}
              <strong className="font-bold">
                {leaveLedgerToDelete?.employee?.name}
              </strong>
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
                onClick={handleDeleteLeaveLedger}
                color="error"
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

export default LeaveLedger;
