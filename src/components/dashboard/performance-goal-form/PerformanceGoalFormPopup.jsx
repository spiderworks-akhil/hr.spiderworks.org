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
import { FaStar } from "react-icons/fa";
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

const validationSchema = (reviewedDate) =>
  yup
    .object()
    .shape({
      title: yup.string().required("Title is required").trim(),
      description: yup.string().nullable().trim(),
      target_date: yup
        .date()
        .required("Target date is required")
        .typeError("Target date is required"),
      reviewer_id: yup
        .number()
        .required("Reviewer is required")
        .typeError("Reviewer is required"),
      user_ids: yup
        .array()
        .of(yup.number())
        .min(1, "At least one employee must be assigned")
        .required("Assign to is required")
        .nullable(),
      green_star_count: yup.number().min(0).max(5).integer().nullable(),
      red_star_count: yup.number().min(0).max(5).integer().nullable(),
    })
    .test(
      "star-count-required",
      "Either Target Achieved or Target Not Achieved stars must be selected",
      function (value) {
        if (reviewedDate) return true;
        const { green_star_count, red_star_count } = value;
        return green_star_count > 0 || red_star_count > 0;
      }
    );

const StarRating = ({
  value,
  onChange,
  color,
  disabled,
  triggerValidation,
}) => {
  const handleClick = (index) => {
    if (disabled) return;
    const newValue = value === index + 1 ? 0 : index + 1;
    onChange(newValue);
    triggerValidation();
  };

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <FaStar
          key={index}
          size={24}
          color={index < value ? color : "#e4e5e9"}
          onClick={() => handleClick(index)}
          className={disabled ? "cursor-default" : "cursor-pointer"}
        />
      ))}
    </Box>
  );
};

const PerformanceGoalFormPopup = ({
  open,
  onClose,
  onSuccess,
  performanceGoal,
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      target_date: null,
      reviewer_id: null,
      user_ids: [],
      green_star_count: 0,
      red_star_count: 0,
    },
    resolver: yupResolver(validationSchema(performanceGoal?.reviewed_date)),
    mode: "onChange",
  });

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/list?limit=1000`);
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

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        description: "",
        target_date: null,
        reviewer_id: null,
        user_ids: [],
        green_star_count: 0,
        red_star_count: 0,
      });
      setError(null);
      return;
    }

    if (performanceGoal) {
      reset({
        title: performanceGoal.title || "",
        description: performanceGoal.description || "",
        target_date: performanceGoal.target_date
          ? moment(performanceGoal.target_date, "YYYY-MM-DD")
          : null,
        reviewer_id: performanceGoal.reviewer_id || null,
        user_ids:
          performanceGoal.assignments?.map(
            (assignment) => assignment.user_id
          ) || [],
        green_star_count: performanceGoal.green_star_count || 0,
        red_star_count: performanceGoal.red_star_count || 0,
      });
    } else {
      reset({
        title: "",
        description: "",
        target_date: null,
        reviewer_id: null,
        user_ids: [],
        green_star_count: 0,
        red_star_count: 0,
      });
    }
  }, [performanceGoal, open, reset]);

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
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        target_date: formatDateSimple(formData.target_date),
        reviewer_id: formData.reviewer_id || null,
        user_ids: formData.user_ids || [],
        green_star_count: formData.green_star_count || 0,
        red_star_count: formData.red_star_count || 0,
        ...(performanceGoal
          ? { updated_by: session?.user?.id || null }
          : {
              created_by: session?.user?.id || null,
              updated_by: session?.user?.id || null,
            }),
      };

      const method = performanceGoal ? "PUT" : "POST";
      const url = performanceGoal
        ? `${BASE_URL}/api/performance-goal/update/${performanceGoal.id}`
        : `${BASE_URL}/api/performance-goal/create`;

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
              performanceGoal ? "update" : "create"
            } performance goal`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Performance goal ${
            performanceGoal ? "updated" : "created"
          } successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${performanceGoal ? "updating" : "creating"} performance goal:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${performanceGoal ? "update" : "create"} performance goal`
      );
      toast.error(
        err.message ||
          `Failed to ${
            performanceGoal ? "update" : "create"
          } performance goal.`,
        { position: "top-right" }
      );
    } finally {
      setLoading(false);
    }
  };

  const isStarsDisabled = !!performanceGoal?.reviewed_date;

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
          {performanceGoal ? "Edit Performance Goal" : "Add Performance Goal"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Box>
              <label className="block mb-1">Title *</label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    className="bg-white"
                    InputProps={{ className: "h-10" }}
                  />
                )}
              />
            </Box>

            <Box>
              <label className="block mb-1">Description</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    className="bg-white"
                  />
                )}
              />
            </Box>

            <Box>
              <label className="block mb-1">Target Date *</label>
              <Controller
                name="target_date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    format="DD-MM-YYYY"
                    value={field.value}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                      trigger("target_date");
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        error: !!errors.target_date,
                        helperText: errors.target_date?.message,
                        className: "bg-white",
                        InputProps: { className: "h-10" },
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              gap={2}
            >
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Reviewer *</label>
                <Controller
                  name="reviewer_id"
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
                        onChange={(selected) => {
                          field.onChange(selected ? selected.value : null);
                          trigger("reviewer_id");
                        }}
                        styles={customSelectStyles}
                        placeholder="Select Reviewer..."
                        isClearable
                      />
                      {errors.reviewer_id && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.reviewer_id?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>

              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Assign To *</label>
                <Controller
                  name="user_ids"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        isMulti
                        options={employeeOptions}
                        value={employeeOptions.filter((opt) =>
                          field.value.includes(opt.value)
                        )}
                        onChange={(selected) => {
                          field.onChange(selected.map((opt) => opt.value));
                          trigger("user_ids");
                        }}
                        styles={customSelectStyles}
                        placeholder="Select Employees..."
                      />
                      {errors.user_ids && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.user_ids?.message}
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
                <label className="block mb-1">
                  Target Achieved (Green Stars)
                </label>
                <Controller
                  name="green_star_count"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <StarRating
                        value={field.value || 0}
                        onChange={(value) => field.onChange(value)}
                        color="#2ac4ab"
                        disabled={isStarsDisabled}
                        triggerValidation={trigger}
                      />
                      {errors.green_star_count && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.green_star_count?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>

              <Box flex={1} minWidth={0}>
                <label className="block mb-1">
                  Target Not Achieved (Red Stars)
                </label>
                <Controller
                  name="red_star_count"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <StarRating
                        value={field.value || 0}
                        onChange={(value) => field.onChange(value)}
                        color="#ef5350"
                        disabled={isStarsDisabled}
                        triggerValidation={trigger}
                      />
                      {errors.red_star_count && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.red_star_count?.message}
                        </span>
                      )}
                      {errors[""] && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors[""].message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
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
            ) : performanceGoal ? (
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

export default PerformanceGoalFormPopup;
