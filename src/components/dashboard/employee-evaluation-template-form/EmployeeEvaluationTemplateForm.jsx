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
  Checkbox,
  FormControlLabel,
  Box,
} from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Select from "react-select";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const validationSchema = yup.object().shape({
  name: yup.string().required("Template name is required").trim(),
  status: yup.string().oneOf(["Draft", "Active", "Cancelled"]).default("Draft"),
  rate_by_client: yup.number().default(0),
  rate_by_manager: yup.number().default(0),
  rate_by_self: yup.number().default(0),
});

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "40px",
    boxShadow: "none",
    "&:hover": {
      border: "1px solid #ccc",
    },
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
    "&:hover": {
      backgroundColor: state.isSelected ? "#2ac4ab" : "#e6f7f5",
    },
  }),
};

const statusOptions = [
  { value: "Draft", label: "Draft" },
  { value: "Active", label: "Active" },
  { value: "Cancelled", label: "Cancelled" },
];

const EmployeeEvaluationTemplateFormPopup = ({
  open,
  onClose,
  onSuccess,
  template,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      status: "Draft",
      rate_by_client: 0,
      rate_by_manager: 0,
      rate_by_self: 0,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        status: "Draft",
        rate_by_client: 0,
        rate_by_manager: 0,
        rate_by_self: 0,
      });
      setError(null);
      return;
    }

    if (template) {
      reset({
        name: template.name || "",
        status: template.status || "Draft",
        rate_by_client: template.rate_by_client || 0,
        rate_by_manager: template.rate_by_manager || 0,
        rate_by_self: template.rate_by_self || 0,
      });
    } else {
      reset({
        name: "",
        status: "Draft",
        rate_by_client: 0,
        rate_by_manager: 0,
        rate_by_self: 0,
      });
    }
  }, [template, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        status: formData.status,
        rate_by_client: formData.rate_by_client ? 1 : 0,
        rate_by_manager: formData.rate_by_manager ? 1 : 0,
        rate_by_self: formData.rate_by_self ? 1 : 0,
      };

      const method = template ? "PUT" : "POST";
      const url = template
        ? `${BASE_URL}/api/employee-evaluation-templates/update/${template.id}`
        : `${BASE_URL}/api/employee-evaluation-templates/create`;

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
            `Failed to ${template ? "update" : "create"} template`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Template ${template ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${template ? "updating" : "creating"} template:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            template ? "update" : "create"
          } template. Please try again.`
      );
      toast.error(
        err.message || `Failed to ${template ? "update" : "create"} template.`,
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
        {template ? "Edit Evaluation Template" : "Add Evaluation Template"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1 text-sm font-medium">
              Template Name *
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  className="bg-white"
                  InputProps={{ className: "h-10" }}
                />
              )}
            />
          </Box>

          <Box>
            <label className="block mb-1 text-sm font-medium">Status *</label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    options={statusOptions}
                    value={
                      statusOptions.find((opt) => opt.value === field.value) ||
                      null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    styles={customSelectStyles}
                    placeholder="Select Status..."
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

          <Box>
            <label className="block mb-1 text-sm font-medium">
              Rating Permissions
            </label>
            <Box display="flex" flexDirection="column" gap={1} mt={1}>
              <Controller
                name="rate_by_client"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={!!field.value}
                        onChange={(e) =>
                          field.onChange(e.target.checked ? 1 : 0)
                        }
                        sx={{
                          color: "#2ac4ab",
                          "&.Mui-checked": {
                            color: "#2ac4ab",
                          },
                        }}
                      />
                    }
                    label="Ratable by Client"
                    sx={{
                      "& .MuiFormControlLabel-label": { fontSize: "14px" },
                    }}
                  />
                )}
              />
              <Controller
                name="rate_by_manager"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={!!field.value}
                        onChange={(e) =>
                          field.onChange(e.target.checked ? 1 : 0)
                        }
                        sx={{
                          color: "#2ac4ab",
                          "&.Mui-checked": {
                            color: "#2ac4ab",
                          },
                        }}
                      />
                    }
                    label="Ratable by Manager"
                    sx={{
                      "& .MuiFormControlLabel-label": { fontSize: "14px" },
                    }}
                  />
                )}
              />
              <Controller
                name="rate_by_self"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={!!field.value}
                        onChange={(e) =>
                          field.onChange(e.target.checked ? 1 : 0)
                        }
                        sx={{
                          color: "#2ac4ab",
                          "&.Mui-checked": {
                            color: "#2ac4ab",
                          },
                        }}
                      />
                    }
                    label="Ratable by Self"
                    sx={{
                      "& .MuiFormControlLabel-label": { fontSize: "14px" },
                    }}
                  />
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
          ) : template ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeEvaluationTemplateFormPopup;
