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
    .required("Applicant is required")
    .typeError("Applicant must be selected"),
  attendance_type: yup.string().required("Attendance type is required"),
  leave_type: yup.string().required("Leave type is required"),
  start_date: yup
    .date()
    .required("Start date is required")
    .typeError("Start date must be a valid date"),
  end_date: yup
    .date()
    .required("End date is required")
    .typeError("End date must be a valid date"),
  manager_id: yup
    .number()
    .required("Manager is required")
    .typeError("Manager must be selected"),
  reason: yup
    .string()
    .required("Reason is required")
    .trim()
    .min(1, "Reason cannot be empty"),
});

const LeaveApplicationFormPopup = ({
  open,
  onClose,
  onSuccess,
  leaveApplication,
}) => {
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
      attendance_type: null,
      leave_type: null,
      start_date: null,
      end_date: null,
      manager_id: null,
      reason: "",
    },
    resolver: yupResolver(validationSchema),
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

    if (open) {
      fetchEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({
        employee_id: null,
        attendance_type: null,
        leave_type: null,
        start_date: null,
        end_date: null,
        manager_id: null,
        reason: "",
      });
      setError(null);
      return;
    }

    if (leaveApplication) {
      reset({
        employee_id: leaveApplication.employee?.id || null,
        attendance_type: leaveApplication.attendance_type || null,
        leave_type: leaveApplication.leave_type || null,
        start_date: leaveApplication.start_date
          ? moment(leaveApplication.start_date)
          : null,
        end_date: leaveApplication.end_date
          ? moment(leaveApplication.end_date)
          : null,
        manager_id: leaveApplication.manager?.id || null,
        reason: leaveApplication.reason || "",
      });
    } else {
      reset({
        employee_id: null,
        attendance_type: null,
        leave_type: null,
        start_date: null,
        end_date: null,
        manager_id: null,
        reason: "",
      });
    }
  }, [leaveApplication, open, reset]);

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
        attendance_type: formData.attendance_type,
        leave_type: formData.leave_type,
        start_date: formatDateSimple(formData.start_date),
        end_date: formatDateSimple(formData.end_date),
        manager_id: formData.manager_id,
        reason: formData.reason.trim(),
        created_by: null,
        updated_by: null,
      };

      const method = leaveApplication ? "PUT" : "POST";
      const url = leaveApplication
        ? `${BASE_URL}/api/leave-application/update/${leaveApplication.id}`
        : `${BASE_URL}/api/leave-application/create`;

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
            `Failed to ${
              leaveApplication ? "update" : "create"
            } leave application`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Leave application ${
            leaveApplication ? "updated" : "created"
          } successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${
          leaveApplication ? "updating" : "creating"
        } leave application:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            leaveApplication ? "update" : "create"
          } leave application`
      );
      toast.error(
        err.message ||
          `Failed to ${
            leaveApplication ? "update" : "create"
          } leave application.`,
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
          {leaveApplication
            ? "Edit Leave Application"
            : "Add Leave Application"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Box>
              <label className="block mb-1">Applicant *</label>
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
                      placeholder="Applicant..."
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

            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={2}
            >
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Attendance Type *</label>
                <Controller
                  name="attendance_type"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={attendanceTypeOptions}
                        value={
                          attendanceTypeOptions.find(
                            (opt) => opt.value === field.value
                          ) || null
                        }
                        onChange={(selected) =>
                          field.onChange(selected ? selected.value : null)
                        }
                        styles={customSelectStyles}
                        placeholder="Attendance Type..."
                        isClearable
                      />
                      {errors.attendance_type && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.attendance_type?.message}
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
                <label className="block mb-1">Start Date *</label>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        trigger("start_date");
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.start_date,
                          helperText: errors.start_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">End Date *</label>
                <Controller
                  name="end_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        trigger("end_date");
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.end_date,
                          helperText: errors.end_date?.message,
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
              <label className="block mb-1">Manager *</label>
              <Controller
                name="manager_id"
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
                      placeholder="Manager..."
                      isClearable
                    />
                    {errors.manager_id && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.manager_id?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Box>

            <Box>
              <label className="block mb-1">Reason *</label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    error={!!errors.reason}
                    helperText={errors.reason?.message}
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
            ) : leaveApplication ? (
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

export default LeaveApplicationFormPopup;
