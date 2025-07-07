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
import Select from "react-select";
import toast from "react-hot-toast";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";
import { BeatLoader } from "react-spinners";

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
  job_title: yup
    .string()
    .required("Job title is required")
    .trim()
    .min(1, "Job title cannot be empty"),
  internal_requirement: yup.string().nullable(),
  public_job_post_content: yup.string().nullable(),
  estimated_hiring_days: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .typeError("Estimated hiring days must be a number")
    .min(0, "Estimated hiring days cannot be negative"),
  priority: yup.string().required("Priority is required"),
  status: yup.string().required("Status is required"),
  hiring_remarks_by_hr: yup.string().nullable(),
  requested_by: yup
    .number()
    .required("Requested by is required")
    .typeError("Requested by must be selected"),
});

const RecruitmentRequestFormPopup = ({
  open,
  onClose,
  onSuccess,
  recruitmentRequest,
  loggedInUserId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userOptions, setUserOptions] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      job_title: "",
      internal_requirement: "",
      public_job_post_content: "",
      estimated_hiring_days: "",
      priority: null,
      status: null,
      hiring_remarks_by_hr: "",
      requested_by: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  const statusOptions = [
    { value: "REQUESTED", label: "Requested" },
    { value: "NOT_APPROVED", label: "Not Approved" },
    { value: "APPROVED", label: "Approved" },
    { value: "INTERVIEWING", label: "Interviewing" },
    { value: "HIRED", label: "Hired" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/list`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        console.log(data);
        const options = data.data?.users.map((user) => ({
          value: user.id,
          label: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
        }));
        setUserOptions(options);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users.", { position: "top-right" });
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({
        job_title: "",
        internal_requirement: "",
        public_job_post_content: "",
        estimated_hiring_days: "",
        priority: null,
        status: null,
        hiring_remarks_by_hr: "",
        requested_by: null,
      });
      setError(null);
      return;
    }

    if (recruitmentRequest) {
      reset({
        job_title: recruitmentRequest.job_title || "",
        internal_requirement: recruitmentRequest.internal_requirement || "",
        public_job_post_content:
          recruitmentRequest.public_job_post_content || "",
        estimated_hiring_days: recruitmentRequest.estimated_hiring_days || "",
        priority: recruitmentRequest.priority || null,
        status: recruitmentRequest.status || null,
        hiring_remarks_by_hr: recruitmentRequest.hiring_remarks_by_hr || "",
        requested_by: recruitmentRequest.requestedBy?.id || null,
      });
    } else {
      reset({
        job_title: "",
        internal_requirement: "",
        public_job_post_content: "",
        estimated_hiring_days: "",
        priority: null,
        status: null,
        hiring_remarks_by_hr: "",
        requested_by: null,
      });
    }
  }, [recruitmentRequest, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        job_title: formData.job_title.trim(),
        internal_requirement: formData.internal_requirement?.trim() || null,
        public_job_post_content:
          formData.public_job_post_content?.trim() || null,
        estimated_hiring_days: formData.estimated_hiring_days
          ? parseInt(formData.estimated_hiring_days, 10)
          : null,
        priority: formData.priority,
        status: formData.status,
        hiring_remarks_by_hr: formData.hiring_remarks_by_hr?.trim() || null,
        requested_by: formData.requested_by,
        created_by: recruitmentRequest ? undefined : loggedInUserId,
        updated_by: loggedInUserId,
      };

      const method = recruitmentRequest ? "PUT" : "POST";
      const url = recruitmentRequest
        ? `${BASE_URL}/api/recruitment-requests/update/${recruitmentRequest.id}`
        : `${BASE_URL}/api/recruitment-requests/create`;

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
              recruitmentRequest ? "update" : "create"
            } recruitment request`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Recruitment request ${
            recruitmentRequest ? "updated" : "created"
          } successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${
          recruitmentRequest ? "updating" : "creating"
        } recruitment request:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            recruitmentRequest ? "update" : "create"
          } recruitment request`
      );
      toast.error(
        err.message ||
          `Failed to ${
            recruitmentRequest ? "update" : "create"
          } recruitment request.`,
        { position: "top-right" }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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
        {recruitmentRequest
          ? "Edit Recruitment Request"
          : "Add Recruitment Request"}
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
              <label className="block mb-1">Job Title *</label>
              <Controller
                name="job_title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.job_title}
                    helperText={errors.job_title?.message}
                    className="bg-white"
                  />
                )}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <label className="block mb-1">Requested By *</label>
              <Controller
                name="requested_by"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      options={userOptions}
                      value={
                        userOptions.find((opt) => opt.value === field.value) ||
                        null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      styles={customSelectStyles}
                      placeholder="Requested By..."
                      isClearable
                    />
                    {errors.requested_by && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.requested_by?.message}
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
              <label className="block mb-1">Priority *</label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      options={priorityOptions}
                      value={
                        priorityOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      styles={customSelectStyles}
                      placeholder="Priority..."
                      isClearable
                    />
                    {errors.priority && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.priority?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <label className="block mb-1">Status *</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      options={statusOptions}
                      value={
                        statusOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      styles={customSelectStyles}
                      placeholder="Status..."
                      isClearable
                    />
                    {errors.status && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.status?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Box>
          </Box>

          <Box>
            <label className="block mb-1">Internal Requirement</label>
            <Controller
              name="internal_requirement"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  error={!!errors.internal_requirement}
                  helperText={errors.internal_requirement?.message}
                  className="bg-white"
                />
              )}
            />
          </Box>

          <Box>
            <label className="block mb-1">Public Job Post Content</label>
            <Controller
              name="public_job_post_content"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  error={!!errors.public_job_post_content}
                  helperText={errors.public_job_post_content?.message}
                  className="bg-white"
                />
              )}
            />
          </Box>

          <Box>
            <label className="block mb-1">Estimated Hiring Days</label>
            <Controller
              name="estimated_hiring_days"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  inputProps={{ step: "1" }}
                  error={!!errors.estimated_hiring_days}
                  helperText={errors.estimated_hiring_days?.message}
                  className="bg-white"
                />
              )}
            />
          </Box>

          <Box>
            <label className="block mb-1">HR Remarks</label>
            <Controller
              name="hiring_remarks_by_hr"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  error={!!errors.hiring_remarks_by_hr}
                  helperText={errors.hiring_remarks_by_hr?.message}
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
          ) : recruitmentRequest ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecruitmentRequestFormPopup;
