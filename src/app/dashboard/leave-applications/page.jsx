"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete, MdRateReview } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Popover,
  Typography,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Grid,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import Select from "react-select";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { BASE_URL } from "@/services/baseUrl";

const LeaveApplicationFormPopup = dynamic(
  () =>
    import(
      "@/components/dashboard/leave-application-form/LeaveApplicationFormPopup"
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

const reviewValidationSchema = yup.object().shape({
  approval_status: yup.string().required("Approval status is required"),
  remarks: yup.string().when("approval_status", {
    is: (value) => ["REJECTED", "PENDING"].includes(value),
    then: (schema) =>
      schema
        .required("Remarks are required for Rejected or Pending status")
        .trim()
        .min(1, "Remarks cannot be empty"),
    otherwise: (schema) => schema.nullable().trim(),
  }),
});

const LeaveApplication = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [employeeId, setEmployeeId] = useState(null);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [leaveType, setLeaveType] = useState(null);
  const [attendanceType, setAttendanceType] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [leaveApplicationToDelete, setLeaveApplicationToDelete] =
    useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editLeaveApplication, setEditLeaveApplication] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewLeaveApplication, setReviewLeaveApplication] = useState(null);
  const [reviewType, setReviewType] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      approval_status: "NOT_REVIEWED",
      remarks: "",
    },
    resolver: yupResolver(reviewValidationSchema),
    mode: "onChange",
  });

  const attendanceTypeOptions = [
    { value: "FULL_DAY", label: "Full Day" },
    { value: "HALF_DAY", label: "Half Day" },
  ];

  const leaveTypeOptions = [
    { value: "CASUAL_LEAVE", label: "Casual Leave" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "COMPENSATORY_LEAVE", label: "Compensatory Leave" },
    { value: "SPECIAL_LEAVE", label: "Special Leave" },
  ];

  const approvalStatusOptions = [
    { value: "NOT_REVIEWED", label: "Not Reviewed" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PENDING", label: "Pending" },
  ];

  const columns = [
    {
      field: "employee",
      headerName: "Applicant",
      width: 150,
      renderCell: (params) => <span>{params.value?.name || "-"}</span>,
    },
    {
      field: "leave_type_combined",
      headerName: "Leave Type",
      width: 200,
      renderCell: (params) => (
        <span>
          {params.row.attendance_type && params.row.leave_type
            ? `${params.row.attendance_type
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) =>
                  c.toUpperCase()
                )} - ${params.row.leave_type
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())}`
            : "-"}
        </span>
      ),
    },
    {
      field: "start_date",
      headerName: "Start Date",
      width: 120,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "end_date",
      headerName: "End Date",
      width: 120,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "manager",
      headerName: "Manager",
      width: 150,
      renderCell: (params) => <span>{params.value?.name || "-"}</span>,
    },
    {
      field: "manager_approval_status",
      headerName: "Manager Status",
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <span>
            {params.value
              ? params.value
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : "-"}
          </span>
          <button
            onClick={() => handleOpenReviewDialog(params.row, "manager")}
            aria-label="Manager review leave application"
            className="p-1"
          >
            <MdRateReview
              className={`w-5 h-5 ${
                params.row.manager_id ? "text-blue-500" : "text-gray-300"
              }`}
            />
          </button>
        </Box>
      ),
    },
    {
      field: "hr_approval_status",
      headerName: "HR Status",
      width: 150,
      renderCell: (params) => (
        <Box display="flex" alignItems="center" gap={1}>
          <span>
            {params.value
              ? params.value
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : "-"}
          </span>
          <button
            onClick={() => handleOpenReviewDialog(params.row, "hr")}
            aria-label="HR review leave application"
            className="p-1"
          >
            <MdRateReview className="w-5 h-5 text-blue-500" />
          </button>
        </Box>
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
          aria-label="Edit leave application"
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
          aria-label="Delete leave application"
          className="p-1"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditLeaveApplication(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (leaveApplication) => {
    setEditLeaveApplication(leaveApplication);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditLeaveApplication(null);
  };

  const handleOpenDeletePopover = (event, leaveApplication) => {
    setAnchorEl(event.currentTarget);
    setLeaveApplicationToDelete(leaveApplication);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setLeaveApplicationToDelete(null);
  };

  const handleOpenReviewDialog = (leaveApplication, type) => {
    setReviewLeaveApplication(leaveApplication);
    setReviewType(type);
    setOpenReviewDialog(true);
    reset({
      approval_status:
        type === "manager"
          ? leaveApplication.manager_approval_status || "NOT_REVIEWED"
          : leaveApplication.hr_approval_status || "NOT_REVIEWED",
      remarks:
        type === "manager"
          ? leaveApplication.manager_remarks || ""
          : leaveApplication.hr_remarks || "",
    });
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setReviewLeaveApplication(null);
    setReviewType(null);
    reset();
    setReviewError(null);
  };

  const handleDeleteLeaveApplication = async () => {
    if (!leaveApplicationToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/leave-application/delete/${leaveApplicationToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete leave application"
        );
      }

      const data = await response.json();
      toast.success(data.message || "Leave application deleted successfully!", {
        position: "top-right",
      });

      await fetchLeaveApplications();
    } catch (error) {
      console.error("Failed to delete leave application:", error);
      setFetchError(
        error.message || "Failed to delete leave application. Please try again."
      );
      toast.error(error.message || "Failed to delete leave application.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveApplications = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(employeeId && { employeeId: employeeId.toString() }),
        ...(from && { from: moment(from).format("YYYY-MM-DD") }),
        ...(to && { to: moment(to).format("YYYY-MM-DD") }),
        ...(leaveType && { leave_type: leaveType }),
        ...(attendanceType && { attendance_type: attendanceType }),
        ...(approvalStatus && { approval_status: approvalStatus }),
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/leave-application/list?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch leave applications");
      }

      const data = await response.json();
      const records = (data.data?.leaveApplications || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid leave application entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          employee: record.employee || null,
          attendance_type: record.attendance_type || null,
          leave_type: record.leave_type || null,
          start_date: record.start_date || null,
          end_date: record.end_date || null,
          reason: record.reason || null,
          manager: record.manager || null,
          manager_id: record.manager_id || null,
          manager_approval_status: record.manager_approval_status || null,
          manager_remarks: record.manager_remarks || null,
          hr_id: record.hr_id || null,
          hr_approval_status: record.hr_approval_status || null,
          hr_remarks: record.hr_remarks || null,
          createdBy: record.createdBy || null,
          updatedBy: record.updatedBy || null,
        }));

      setLeaveApplications(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch leave applications:", error);
      setFetchError("Failed to load leave applications. Please try again.");
      setLeaveApplications([]);
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
    fetchLeaveApplications();
  }, [page, employeeId, from, to, leaveType, attendanceType, approvalStatus]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    switch (field) {
      case "employeeId":
        setEmployeeId(value);
        break;
      case "from":
        setFrom(value);
        break;
      case "to":
        setTo(value);
        break;
      case "leaveType":
        setLeaveType(value);
        break;
      case "attendanceType":
        setAttendanceType(value);
        break;
      case "approvalStatus":
        setApprovalStatus(value);
        break;
    }
  };

  const handleReviewSubmit = async (formData) => {
    try {
      setReviewLoading(true);
      setReviewError(null);

      const payload = {
        approval_status: formData.approval_status,
        remarks: formData.remarks?.trim() || null,
        updated_by: null,
      };

      const url = `${BASE_URL}/api/leave-application/review/${reviewType}/${reviewLeaveApplication.id}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to submit ${reviewType} review`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `${
            reviewType.charAt(0).toUpperCase() + reviewType.slice(1)
          } review submitted successfully!`,
        {
          position: "top-right",
        }
      );

      fetchLeaveApplications();
      handleCloseReviewDialog();
    } catch (err) {
      console.error(`Error submitting ${reviewType} review:`, err);
      setReviewError(err.message || `Failed to submit ${reviewType} review`);
      toast.error(err.message || `Failed to submit ${reviewType} review.`, {
        position: "top-right",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditLeaveApplication(null);
    fetchLeaveApplications();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No leave applications found
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="min-h-screen bg-white p-4">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Leave Applications ({total})
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
            + Add Leave Application
          </Button>
        </div>

        <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
          <Box width={{ xs: "100%", sm: "200px" }}>
            <label className="block mb-1 text-sm font-medium">Employee</label>
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
            <label className="block mb-1 text-sm font-medium">
              Attendance Type
            </label>
            <Select
              options={attendanceTypeOptions}
              value={
                attendanceTypeOptions.find(
                  (opt) => opt.value === attendanceType
                ) || null
              }
              onChange={(selected) =>
                handleFilterChange(
                  "attendanceType",
                  selected ? selected.value : null
                )
              }
              styles={customSelectStyles}
              placeholder="Type..."
              isClearable
            />
          </Box>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <label className="block mb-1 text-sm font-medium">Leave Type</label>
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
              placeholder="Type..."
              isClearable
            />
          </Box>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <label className="block mb-1 text-sm font-medium">
              Approval Status
            </label>
            <Select
              options={approvalStatusOptions}
              value={
                approvalStatusOptions.find(
                  (opt) => opt.value === approvalStatus
                ) || null
              }
              onChange={(selected) =>
                handleFilterChange(
                  "approvalStatus",
                  selected ? selected.value : null
                )
              }
              styles={customSelectStyles}
              placeholder="Status..."
              isClearable
            />
          </Box>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <label className="block mb-1 text-sm font-medium">From Date</label>
            <DesktopDatePicker
              inputFormat="DD-MM-YYYY"
              value={from}
              onChange={(newValue) => handleFilterChange("from", newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  className: "bg-white",
                  InputProps: { className: "h-10" },
                },
              }}
            />
          </Box>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <label className="block mb-1 text-sm font-medium">To Date</label>
            <DesktopDatePicker
              inputFormat="DD-MM-YYYY"
              value={to}
              onChange={(newValue) => handleFilterChange("to", newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: "small",
                  className: "bg-white",
                  InputProps: { className: "h-10" },
                },
              }}
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
              rows={leaveApplications}
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

        <LeaveApplicationFormPopup
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
          leaveApplication={editLeaveApplication}
        />

        <Dialog
          open={openReviewDialog}
          onClose={handleCloseReviewDialog}
          sx={{
            "& .MuiDialog-paper": {
              width: { xs: "90vw", sm: "500px" },
              maxHeight: "80vh",
              borderRadius: "8px",
            },
          }}
        >
          <DialogTitle className="text-lg font-semibold">
            {reviewType === "manager" ? "Manager Review" : "HR Review"}
          </DialogTitle>
          <DialogContent className="overflow-y-auto">
            {reviewError && (
              <Box className="text-red-600 mb-4">{reviewError}</Box>
            )}
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Applicant:
                </label>
                <Typography>
                  {reviewLeaveApplication?.employee?.name || "-"}
                </Typography>
              </Box>
              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Leave Type:
                </label>
                <Typography>
                  {reviewLeaveApplication?.leave_type
                    ? reviewLeaveApplication.leave_type
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : "-"}
                </Typography>
              </Box>
              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Attendance Type:
                </label>
                <Typography>
                  {reviewLeaveApplication?.attendance_type
                    ? reviewLeaveApplication.attendance_type
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    : "-"}
                </Typography>
              </Box>
              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Approval Status *
                </label>
                <Controller
                  name="approval_status"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        trigger(["approval_status", "remarks"]);
                      }}
                    >
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            value="NOT_REVIEWED"
                            control={<Radio />}
                            label="Not Reviewed"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            value="APPROVED"
                            control={<Radio />}
                            label="Approved"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            value="REJECTED"
                            control={<Radio />}
                            label="Rejected"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControlLabel
                            value="PENDING"
                            control={<Radio />}
                            label="Pending"
                          />
                        </Grid>
                      </Grid>
                    </RadioGroup>
                  )}
                />
                {errors.approval_status && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {errors.approval_status?.message}
                  </span>
                )}
              </Box>
              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Remarks{" "}
                  {["REJECTED", "PENDING"].includes(
                    control._formValues.approval_status
                  )
                    ? "*"
                    : ""}
                </label>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      multiline
                      rows={3}
                      error={!!errors.remarks}
                      helperText={errors.remarks?.message}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions
            sx={{ justifyContent: "justify-between", px: 3, pb: 3, pt: 2 }}
          >
            <Button
              onClick={handleCloseReviewDialog}
              sx={{
                backgroundColor: "#ffebee",
                color: "#ef5350",
                "&:hover": { backgroundColor: "#ffcdd2" },
                padding: "8px 16px",
                borderRadius: "8px",
              }}
              disabled={reviewLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleReviewSubmit)}
              sx={{
                backgroundColor: "rgb(42,196,171)",
                color: "white",
                "&:hover": { backgroundColor: "rgb(36,170,148)" },
                padding: "8px 16px",
                borderRadius: "8px",
              }}
              disabled={reviewLoading}
            >
              {reviewLoading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseDeletePopover}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Box sx={{ p: 2, width: 260 }}>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to delete leave application for{" "}
              <strong className="font-bold">
                {leaveApplicationToDelete?.employee?.name}
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
                onClick={handleDeleteLeaveApplication}
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

export default LeaveApplication;
