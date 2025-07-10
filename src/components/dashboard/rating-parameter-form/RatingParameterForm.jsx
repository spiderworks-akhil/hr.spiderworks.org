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
  FormControl,
  RadioGroup,
  Radio,
} from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const validationSchema = yup.object().shape({
  name: yup.string().required("Parameter name is required").trim(),
  description: yup.string().trim(),
  ratable_by_client: yup.number().default(0),
  ratable_by_manager: yup.number().default(0),
  ratable_by_self: yup.number().default(0),
  type: yup
    .string()
    .oneOf(["STAR_RATING", "DESCRIPTIVE"])
    .required("Type is required"),
});

const RatingParameterFormPopup = ({ open, onClose, onSuccess, parameter }) => {
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
      description: "",
      ratable_by_client: 0,
      ratable_by_manager: 0,
      ratable_by_self: 0,
      type: "STAR_RATING",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        description: "",
        ratable_by_client: 0,
        ratable_by_manager: 0,
        ratable_by_self: 0,
        type: "STAR_RATING",
      });
      setError(null);
      return;
    }

    if (parameter) {
      reset({
        name: parameter.name || "",
        description: parameter.description || "",
        ratable_by_client: parameter.ratable_by_client || 0,
        ratable_by_manager: parameter.ratable_by_manager || 0,
        ratable_by_self: parameter.ratable_by_self || 0,
        type: parameter.type || "STAR_RATING",
      });
    } else {
      reset({
        name: "",
        description: "",
        ratable_by_client: 0,
        ratable_by_manager: 0,
        ratable_by_self: 0,
        type: "STAR_RATING",
      });
    }
  }, [parameter, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        ratable_by_client: formData.ratable_by_client ? 1 : 0,
        ratable_by_manager: formData.ratable_by_manager ? 1 : 0,
        ratable_by_self: formData.ratable_by_self ? 1 : 0,
        type: formData.type,
      };

      const method = parameter ? "PUT" : "POST";
      const url = parameter
        ? `${BASE_URL}/api/employee-rating-parameter/update/${parameter.id}`
        : `${BASE_URL}/api/employee-rating-parameter/create`;

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
            `Failed to ${parameter ? "update" : "create"} parameter`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Parameter ${parameter ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${parameter ? "updating" : "creating"} parameter:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            parameter ? "update" : "create"
          } parameter. Please try again.`
      );
      toast.error(
        err.message ||
          `Failed to ${parameter ? "update" : "create"} parameter.`,
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
        {parameter ? "Edit Rating Parameter" : "Add Rating Parameter"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        <Box mb={2}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormControl component="fieldset">
                <label className="block mb-1 font-medium">Type *</label>
                <RadioGroup
                  row
                  {...field}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <FormControlLabel
                    value="STAR_RATING"
                    control={
                      <Radio
                        sx={{
                          color: "rgb(42,196,171)",
                          "&.Mui-checked": { color: "rgb(42,196,171)" },
                        }}
                      />
                    }
                    label="Star Rating"
                  />
                  <FormControlLabel
                    value="DESCRIPTIVE"
                    control={
                      <Radio
                        sx={{
                          color: "rgb(42,196,171)",
                          "&.Mui-checked": { color: "rgb(42,196,171)" },
                        }}
                      />
                    }
                    label="Descriptive"
                  />
                </RadioGroup>
                {errors.type && (
                  <span className="text-red-600 text-xs">
                    {errors.type.message}
                  </span>
                )}
              </FormControl>
            )}
          />
        </Box>

        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">Parameter Name *</label>
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
            <Controller
              name="ratable_by_client"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                      sx={{
                        color: "rgb(42,196,171)",
                        "&.Mui-checked": {
                          color: "rgb(42,196,171)",
                        },
                      }}
                    />
                  }
                  label="Ratable by Client"
                />
              )}
            />
          </Box>

          <Box>
            <Controller
              name="ratable_by_manager"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                      sx={{
                        color: "rgb(42,196,171)",
                        "&.Mui-checked": {
                          color: "rgb(42,196,171)",
                        },
                      }}
                    />
                  }
                  label="Ratable by Manager"
                />
              )}
            />
          </Box>

          <Box>
            <Controller
              name="ratable_by_self"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked ? 1 : 0)}
                      sx={{
                        color: "rgb(42,196,171)",
                        "&.Mui-checked": {
                          color: "rgb(42,196,171)",
                        },
                      }}
                    />
                  }
                  label="Ratable by Self"
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
          ) : parameter ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingParameterFormPopup;
