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
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
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
  feedback: yup.string().required("Feedback is required").trim(),
  provided_by: yup
    .object()
    .shape({
      value: yup.number().required("Provided by is required"),
      label: yup.string().required(),
    })
    .required("Provided by is required"),
  provided_to: yup
    .object()
    .shape({
      value: yup.number().required("Provided to is required"),
      label: yup.string().required(),
    })
    .required("Provided to is required"),
});

const PeerFeedbackFormPopup = ({ open, onClose, onSuccess, feedback }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      feedback: "",
      provided_by: null,
      provided_to: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const fetchEmployees = async (search = "") => {
    try {
      const queryParams = new URLSearchParams();
      if (search) {
        queryParams.append("keyword", search);
      }
      queryParams.append("limit", "1000");

      const query = queryParams.toString();
      const response = await fetch(`${BASE_URL}/api/employees/list?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      const employeeOptions = (data.data?.employees || []).map((emp) => ({
        value: emp.id,
        label: emp.name || `Employee ${emp.id}`,
      }));
      setEmployees(employeeOptions);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees. Please try again.");
      setEmployees([]);
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
        feedback: "",
        provided_by: null,
        provided_to: null,
      });
      setEmployeeSearch("");
      setEmployees([]);
      setError(null);
      return;
    }

    if (feedback) {
      reset({
        feedback: feedback.feedback || "",
        provided_by: feedback.providedBy
          ? { value: feedback.providedBy.id, label: feedback.providedBy.name }
          : null,
        provided_to: feedback.providedTo
          ? { value: feedback.providedTo.id, label: feedback.providedTo.name }
          : null,
      });
    } else {
      reset({
        feedback: "",
        provided_by: null,
        provided_to: null,
      });
    }
  }, [feedback, open, reset]);

  const handleEmployeeSearch = (inputValue) => {
    setEmployeeSearch(inputValue);
    fetchEmployees(inputValue);
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        feedback: formData.feedback.trim(),
        provided_by: formData.provided_by.value,
        provided_to: formData.provided_to.value,
      };

      const method = feedback ? "PUT" : "POST";
      const url = feedback
        ? `${BASE_URL}/api/peer-feedback/update/${feedback.id}`
        : `${BASE_URL}/api/peer-feedback/create`;

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
            `Failed to ${feedback ? "update" : "create"} feedback`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Feedback ${feedback ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${feedback ? "updating" : "creating"} feedback:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            feedback ? "update" : "create"
          } feedback. Please try again.`
      );
      toast.error(
        err.message || `Failed to ${feedback ? "update" : "create"} feedback.`,
        {
          position: "top-right",
        }
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
        {feedback ? "Edit Feedback" : "Add Feedback"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">Feedback *</label>
            <Controller
              name="feedback"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  multiline
                  rows={4}
                  error={!!errors.feedback}
                  helperText={errors.feedback?.message}
                  className="bg-white"
                />
              )}
            />
          </Box>

          <Box>
            <label className="block mb-1">Provided By *</label>
            <Controller
              name="provided_by"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    {...field}
                    options={employees}
                    onInputChange={handleEmployeeSearch}
                    placeholder="Select employee..."
                    isClearable
                    styles={customSelectStyles}
                  />
                  {errors.provided_by && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.provided_by.message}
                    </span>
                  )}
                </div>
              )}
            />
          </Box>

          <Box>
            <label className="block mb-1">Provided To *</label>
            <Controller
              name="provided_to"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    {...field}
                    options={employees}
                    onInputChange={handleEmployeeSearch}
                    placeholder="Select employee..."
                    isClearable
                    styles={customSelectStyles}
                  />
                  {errors.provided_to && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.provided_to.message}
                    </span>
                  )}
                </div>
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
          ) : feedback ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PeerFeedbackFormPopup;
