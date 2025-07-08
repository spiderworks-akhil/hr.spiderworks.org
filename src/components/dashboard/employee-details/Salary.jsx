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
  Grid,
} from "@mui/material";
import { MdEdit, MdDelete } from "react-icons/md";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DesktopDatePicker } from "@mui/x-date-pickers/DesktopDatePicker";
import { Controller, useForm } from "react-hook-form";
import { BASE_URL } from "@/services/baseUrl";

const EmployeeSalaryRevision = ({ employee }) => {
  const [salaryRevisions, setSalaryRevisions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    revisionId: null,
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      id: 0,
      effective_date: null,
      basic_pay: "",
      tds_deduction_amount: "",
      esi_employee_share: "",
      esi_employer_share: "",
      pf_employee_share: "",
      pf_employer_share: "",
      hra: "",
      travel_allowance: "",
      other_allowance: "",
      remarks: "",
    },
  });

  const numberRegex = /^\d+(\.\d{0,2})?$/;

  const formValues = watch([
    "basic_pay",
    "hra",
    "travel_allowance",
    "other_allowance",
    "tds_deduction_amount",
    "esi_employee_share",
    "pf_employee_share",
  ]);

  const calculateGrandTotal = () => {
    const basicPay = parseFloat(formValues[0]) || 0;
    const hra = parseFloat(formValues[1]) || 0;
    const travelAllowance = parseFloat(formValues[2]) || 0;
    const otherAllowance = parseFloat(formValues[3]) || 0;
    const tdsDeduction = parseFloat(formValues[4]) || 0;
    const esiEmployeeShare = parseFloat(formValues[5]) || 0;
    const pfEmployeeShare = parseFloat(formValues[6]) || 0;

    const esiEmployeeContribution = (basicPay * esiEmployeeShare) / 100;
    const pfEmployeeContribution = (basicPay * pfEmployeeShare) / 100;

    return (
      basicPay +
      hra +
      travelAllowance +
      otherAllowance -
      tdsDeduction -
      esiEmployeeContribution -
      pfEmployeeContribution
    ).toFixed(2);
  };

  const handleNumericInput = (e) => {
    const value = e.target.value;
    if (value && !/^\d*\.?\d{0,2}$/.test(value)) {
      e.target.value = value.slice(0, -1);
    }
  };

  const fetchSalaryRevisions = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-salary-revision/list/${employee.id}?page=${
          page + 1
        }&limit=3${search ? `&keyword=${encodeURIComponent(search)}` : ""}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch salary revisions");
      }
      const data = await response.json();
      setSalaryRevisions(data.data?.salaryRevisions || []);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch salary revisions:", error);
      setFetchError(
        error.message || "Failed to load salary revisions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryRevisions(page, searchQuery);
  }, [page, searchQuery, employee.id]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (mode, revision = null) => {
    setModalMode(mode);
    if (mode === "edit" && revision) {
      reset({
        id: revision.id,
        effective_date: revision.effective_date
          ? moment(revision.effective_date)
          : null,
        basic_pay: revision.basic_pay?.toString() || "",
        tds_deduction_amount: revision.tds_deduction_amount?.toString() || "",
        esi_employee_share: revision.esi_employee_share?.toString() || "",
        esi_employer_share: revision.esi_employer_share?.toString() || "",
        pf_employee_share: revision.pf_employee_share?.toString() || "",
        pf_employer_share: revision.pf_employer_share?.toString() || "",
        hra: revision.hra?.toString() || "",
        travel_allowance: revision.travel_allowance?.toString() || "",
        other_allowance: revision.other_allowance?.toString() || "",
        remarks: revision.remarks || "",
      });
    } else {
      reset({
        id: 0,
        effective_date: null,
        basic_pay: "",
        tds_deduction_amount: "",
        esi_employee_share: "",
        esi_employer_share: "",
        pf_employee_share: "",
        pf_employer_share: "",
        hra: "",
        travel_allowance: "",
        other_allowance: "",
        remarks: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset();
  };

  const onSubmit = async (formData) => {
    let version = 0;
    if (
      employee.employeeLevel &&
      typeof employee.employeeLevel === "object" &&
      employee.employeeLevel.name
    ) {
      const levelName = employee.employeeLevel.name.toLowerCase();
      switch (levelName) {
        case "intern":
          version = 1;
          break;
        case "trainee":
          version = 2;
          break;
        case "executive":
          version = 3;
          break;
        case "manager":
          version = 4;
          break;
        case "senior executive":
          version = 5;
          break;
        case "director":
          version = 6;
          break;
        default:
          version = 0;
      }
    }

    const payload = {
      employee_id: employee.id,
      version,
      effective_date: formData.effective_date
        ? moment(formData.effective_date).format("YYYY-MM-DD")
        : undefined,
      basic_pay: parseFloat(formData.basic_pay) || undefined,
      tds_deduction_amount: formData.tds_deduction_amount
        ? parseFloat(formData.tds_deduction_amount)
        : undefined,
      esi_employee_share: formData.esi_employee_share
        ? parseFloat(formData.esi_employee_share)
        : undefined,
      esi_employer_share: formData.esi_employer_share
        ? parseFloat(formData.esi_employer_share)
        : undefined,
      pf_employee_share: formData.pf_employee_share
        ? parseFloat(formData.pf_employee_share)
        : undefined,
      pf_employer_share: formData.pf_employer_share
        ? parseFloat(formData.pf_employer_share)
        : undefined,
      hra: formData.hra ? parseFloat(formData.hra) : undefined,
      travel_allowance: formData.travel_allowance
        ? parseFloat(formData.travel_allowance)
        : undefined,
      other_allowance: formData.other_allowance
        ? parseFloat(formData.other_allowance)
        : undefined,
      grand_total: parseFloat(calculateGrandTotal()),
      remarks: formData.remarks || undefined,
    };

    try {
      setLoading(true);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-salary-revision/create`
          : `${BASE_URL}/api/employee-salary-revision/update/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
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
            `Failed to ${
              modalMode === "add" ? "create" : "update"
            } salary revision`
        );
      }

      toast.success(data.message || "Salary revision saved successfully!", {
        position: "top-right",
      });

      await fetchSalaryRevisions(page, searchQuery);
      handleCloseDialog();
    } catch (error) {
      console.error(
        `Failed to ${
          modalMode === "add" ? "create" : "update"
        } salary revision:`,
        error
      );
      toast.error(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } salary revision. Please try again.`,
        { position: "top-right" }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeletePopover = (event, revisionId) => {
    setDeletePopover({ anchorEl: event.currentTarget, revisionId });
  };

  const handleCloseDeletePopover = () => {
    setDeletePopover({ anchorEl: null, revisionId: null });
  };

  const handleDelete = async () => {
    if (!deletePopover.revisionId) return;

    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-salary-revision/delete/${deletePopover.revisionId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to delete salary revision");
      }

      toast.success(data.message || "Salary revision deleted successfully!", {
        position: "top-right",
      });

      await fetchSalaryRevisions(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete salary revision:", error);
      setFetchError(
        error.message || "Failed to delete salary revision. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No salary revisions found
    </Box>
  );

  const columns = [
    {
      field: "basic_pay",
      headerName: "Basic Pay",
      width: 100,
      renderCell: (params) =>
        params.value ? parseFloat(params.value).toFixed(2) : "-",
    },
    {
      field: "effective_date",
      headerName: "Effective Date",
      width: 120,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD-MM-YYYY") : "-",
    },
    {
      field: "tds_deduction_amount",
      headerName: "TDS Deduction",
      width: 120,
      renderCell: (params) =>
        params.value ? parseFloat(params.value).toFixed(2) : "-",
    },
    {
      field: "esi_employee_share",
      headerName: "ESI Employee (%)",
      width: 140,
      renderCell: (params) =>
        params.value ? `${parseFloat(params.value).toFixed(2)}%` : "-",
    },
    {
      field: "esi_employer_share",
      headerName: "ESI Employer (%)",
      width: 140,
      renderCell: (params) =>
        params.value ? `${parseFloat(params.value).toFixed(2)}%` : "-",
    },
    {
      field: "pf_employee_share",
      headerName: "PF Employee (%)",
      width: 130,
      renderCell: (params) =>
        params.value ? `${parseFloat(params.value).toFixed(2)}%` : "-",
    },
    {
      field: "pf_employer_share",
      headerName: "PF Employer (%)",
      width: 130,
      renderCell: (params) =>
        params.value ? `${parseFloat(params.value).toFixed(2)}%` : "-",
    },
    {
      field: "hra",
      headerName: "HRA",
      width: 100,
      renderCell: (params) =>
        params.value ? parseFloat(params.value).toFixed(2) : "-",
    },
    {
      field: "travel_allowance",
      headerName: "Travel Allowance",
      width: 130,
      renderCell: (params) =>
        params.value ? parseFloat(params.value).toFixed(2) : "-",
    },
    {
      field: "other_allowance",
      headerName: "Other Allowance",
      width: 130,
      renderCell: (params) =>
        params.value ? parseFloat(params.value).toFixed(2) : "-",
    },
    {
      field: "grand_total",
      headerName: "Grand Total",
      width: 100,
      renderCell: (params) =>
        params.value ? parseFloat(params.value).toFixed(2) : "-",
    },
    { field: "remarks", headerName: "Remarks", width: 150 },
    {
      field: "created_at",
      headerName: "Created At",
      width: 120,
      renderCell: (params) =>
        params.value ? moment(params.value).format("DD-MM-YYYY") : "-",
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenDialog("edit", params.row)}
          aria-label="Edit salary revision"
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
          aria-label="Delete salary revision"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="p-6">
        <Toaster position="top-right" reverseOrder={true} />
        {fetchError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {fetchError}
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            gap: 2,
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Search Salary Revisions"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              flex: 1,
              maxWidth: 300,
              "& .MuiOutlinedInput-root": {
                borderRadius: "20px",
                "& fieldset": { borderColor: "rgba(0, 0, 0, 0.2)" },
                "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.4)" },
                "&.Mui-focused fieldset": { borderColor: "rgb(42,196,171)" },
              },
              "& .MuiInputBase-input": { padding: "10px 14px" },
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
            Add Salary Revision
          </Button>
        </Box>
        <Paper sx={{ width: "100%", boxShadow: "none" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <BeatLoader color="rgb(42,196,171)" size={12} />
            </Box>
          ) : (
            <DataGrid
              rows={salaryRevisions}
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
                  "&:hover": { backgroundColor: "rgba(234, 248, 244, 1)" },
                },
                "& .MuiDataGrid-cell": { border: "none" },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "none",
                  borderBottom: "none",
                },
                "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader--sorted":
                  { outline: "none" },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell--sorted":
                  { outline: "none" },
              }}
              slots={{ noRowsOverlay: CustomNoRowsOverlay }}
              slotProps={{ pagination: { showRowsPerPage: false } }}
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
            {modalMode === "add"
              ? "Add Salary Revision"
              : "Edit Salary Revision"}
          </DialogTitle>
          <DialogContent className="overflow-y-auto">
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box>
                <label className="block mb-1 text-md">Effective Date</label>
                <Controller
                  name="effective_date"
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                      <DesktopDatePicker
                        format="DD-MM-YYYY"
                        value={field.value}
                        onChange={(newValue) => field.onChange(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: "small",
                            error: !!errors.effective_date,
                            helperText: errors.effective_date?.message,
                            sx: {
                              "& .MuiOutlinedInput-root": {
                                "&:hover fieldset": {
                                  borderColor: "rgba(42,196,171, 0.5)",
                                },
                                "&.Mui-focused fieldset": {
                                  borderColor: "rgb(42,196,171)",
                                },
                              },
                            },
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">Basic Pay *</label>
                <Controller
                  name="basic_pay"
                  control={control}
                  rules={{
                    required: "Basic pay is required",
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid number (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.basic_pay}
                      helperText={errors.basic_pay?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">
                  TDS Deduction Amount
                </label>
                <Controller
                  name="tds_deduction_amount"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid number (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.tds_deduction_amount}
                      helperText={errors.tds_deduction_amount?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">
                  ESI Employee Share (%)
                </label>
                <Controller
                  name="esi_employee_share"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid percentage (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.esi_employee_share}
                      helperText={errors.esi_employee_share?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">
                  ESI Employer Share (%)
                </label>
                <Controller
                  name="esi_employer_share"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid percentage (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.esi_employer_share}
                      helperText={errors.esi_employer_share?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">
                  PF Employee Share (%)
                </label>
                <Controller
                  name="pf_employee_share"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid percentage (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.pf_employee_share}
                      helperText={errors.pf_employee_share?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">
                  PF Employer Share (%)
                </label>
                <Controller
                  name="pf_employer_share"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid percentage (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.pf_employer_share}
                      helperText={errors.pf_employer_share?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">HRA</label>
                <Controller
                  name="hra"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid number (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.hra}
                      helperText={errors.hra?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">Travel Allowance</label>
                <Controller
                  name="travel_allowance"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid number (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.travel_allowance}
                      helperText={errors.travel_allowance?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">Other Allowance</label>
                <Controller
                  name="other_allowance"
                  control={control}
                  rules={{
                    pattern: {
                      value: numberRegex,
                      message: "Must be a valid number (up to 2 decimals)",
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      size="small"
                      error={!!errors.other_allowance}
                      helperText={errors.other_allowance?.message}
                      onInput={handleNumericInput}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box>
                <label className="block mb-1 text-md">Remarks</label>
                <Controller
                  name="remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
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
              <Box>
                <Typography variant="body1" className="text-sm font-medium">
                  Grand Total: {calculateGrandTotal()}
                </Typography>
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
              onClick={handleSubmit(onSubmit)}
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
              Are you sure you want to delete this salary revision?
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
    </LocalizationProvider>
  );
};

export default EmployeeSalaryRevision;
