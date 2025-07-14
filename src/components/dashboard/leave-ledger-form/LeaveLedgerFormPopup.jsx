"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Select from "react-select";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

const validationSchema = yup.object().shape({
  employee_id: yup
    .number()
    .required("Employee is required")
    .typeError("Employee must be selected"),
  leave_type: yup.string().required("Leave type is required"),
  count: yup
    .number()
    .required("Count is required")
    .typeError("Count must be a number")
    .min(0, "Count cannot be negative"),
  eligibility_date: yup
    .date()
    .required("Eligibility date is required")
    .typeError("Eligibility date must be a valid date"),
  remarks: yup
    .string()
    .required("Remarks is required")
    .trim()
    .min(1, "Remarks cannot be empty"),
});

const LeaveLedgerFormPopup = ({ open, onClose, onSuccess, leaveLedger }) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      employee_id: null,
      leave_type: null,
      count: "",
      eligibility_date: null,
      remarks: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const leaveTypeOptions = [
    { value: "CASUAL_LEAVE", label: "Casual Leave" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "COMPENSATORY_LEAVE", label: "Compensatory Leave" },
    { value: "SPECIAL_LEAVE", label: "Special Leave" },
  ];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/employees/list?limit=1000`
        );
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

    if (open) {
      fetchEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({
        employee_id: null,
        leave_type: null,
        count: "",
        eligibility_date: null,
        remarks: "",
      });
      setError(null);
      return;
    }

    if (leaveLedger) {
      reset({
        employee_id: leaveLedger.employee?.id || null,
        leave_type: leaveLedger.leave_type || null,
        count: leaveLedger.count || "",
        eligibility_date: leaveLedger.eligibility_date
          ? moment(leaveLedger.eligibility_date)
          : null,
        remarks: leaveLedger.remarks || "",
      });
    } else {
      reset({
        employee_id: null,
        leave_type: null,
        count: "",
        eligibility_date: null,
        remarks: "",
      });
    }
  }, [leaveLedger, open, reset]);

  const formatDateSimple = (date) => {
    if (!date) return null;
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : null;
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        employee_id: formData.employee_id,
        leave_type: formData.leave_type,
        count: parseFloat(formData.count),
        eligibility_date: formatDateSimple(formData.eligibility_date),
        remarks: formData.remarks.trim(),
        ...(leaveLedger
          ? { updated_by: session?.user?.id || null }
          : {
              created_by: session?.user?.id || null,
              updated_by: session?.user?.id || null,
            }),
      };

      const method = leaveLedger ? "PUT" : "POST";
      const url = leaveLedger
        ? `${BASE_URL}/api/leave-ledger/update/${leaveLedger.id}`
        : `${BASE_URL}/api/leave-ledger/create`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${leaveLedger ? "update" : "create"} leave ledger`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Leave ledger ${leaveLedger ? "updated" : "created"} successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${leaveLedger ? "updating" : "creating"} leave ledger:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${leaveLedger ? "update" : "create"} leave ledger`
      );
      toast.error(
        err.message ||
          `Failed to ${leaveLedger ? "update" : "create"} leave ledger.`,
        { position: "top-right" }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Dialog
        open={open}
        onClose={onClose}
        TransitionComponent={Transition}
        transitionDuration={500}
        sx={{
          "& .MuiDialog-paper": {
            margin: 0,
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: { xs: "100%", sm: "min(100%, 500px)" },
            maxWidth: "500px",
            height: "100%",
            borderRadius: 0,
            maxHeight: "100%",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">
          {leaveLedger ? "Edit Leave Ledger" : "Add Leave Ledger"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={2}
            >
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Employee *</label>
                <Controller
                  name="employee_id"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={employeeOptions}
                        value={
                          employeeOptions.find(
                            (opt) => opt.value === field.value
                          ) || null
                        }
                        onChange={(selected) =>
                          field.onChange(selected ? selected.value : null)
                        }
                        styles={customSelectStyles}
                        placeholder="Employee..."
                        isClearable
                      />
                      {errors.employee_id && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.employee_id?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Leave Type *</label>
                <Controller
                  name="leave_type"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={leaveTypeOptions}
                        value={
                          leaveTypeOptions.find(
                            (opt) => opt.value === field.value
                          ) || null
                        }
                        onChange={(selected) =>
                          field.onChange(selected ? selected.value : null)
                        }
                        styles={customSelectStyles}
                        placeholder="Leave Type..."
                        isClearable
                      />
                      {errors.leave_type && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.leave_type?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
            </Box>

            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={2}
            >
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Count *</label>
                <Controller
                  name="count"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      type="number"
                      inputProps={{ step: "0.5" }}
                      error={!!errors.count}
                      helperText={errors.count?.message}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Eligibility Date *</label>
                <Controller
                  name="eligibility_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        trigger("eligibility_date");
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.eligibility_date,
                          helperText: errors.eligibility_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
            </Box>

            <Box>
              <label className="block mb-1">Remarks *</label>
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
                    rows={4}
                    error={!!errors.remarks}
                    helperText={errors.remarks?.message}
                    className="bg-white"
                  />
                )}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
          <Button
            onClick={onClose}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            Close
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
            {loading ? (
              <BeatLoader color="#fff" size={8} />
            ) : leaveLedger ? (
              "Update"
            ) : (
              "Submit"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default LeaveLedgerFormPopup;
