"use client";

import React from "react";
import { useState, useEffect } from "react";
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
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const validationSchema = yup.object().shape({
  name: yup
    .string()
    .required("Level name is required")
    .trim()
    .min(1, "Level name cannot be empty"),
  level_index: yup
    .number()
    .nullable()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .typeError("Level index must be a number"),
});

const EmployeeLevelFormPopup = ({
  open,
  onClose,
  onSuccess,
  employeeLevel,
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    trigger,
  } = useForm({
    defaultValues: {
      name: "",
      level_index: null,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "", level_index: null });
      setError(null);
      return;
    }

    if (employeeLevel) {
      reset({
        name: employeeLevel.name || "",
        level_index: employeeLevel.level_index || null,
      });
    } else {
      reset({ name: "", level_index: null });
    }
  }, [employeeLevel, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const userId = session?.user?.id;

      let payload = {
        name: formData.name.trim(),
        level_index: formData.level_index,
      };

      if (employeeLevel) {
        payload.updated_by = userId;
      } else {
        payload.created_by = userId;
        payload.updated_by = userId;
      }

      const method = employeeLevel ? "PUT" : "POST";
      const url = employeeLevel
        ? `${BASE_URL}/api/employee-level/update/${employeeLevel.id}`
        : `${BASE_URL}/api/employee-level/create`;

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
            `Failed to ${employeeLevel ? "update" : "create"} employee level`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Employee level ${
            employeeLevel ? "updated" : "created"
          } successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${employeeLevel ? "updating" : "creating"} employee level:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${employeeLevel ? "update" : "create"} employee level.`
      );
      toast.error(
        err.message ||
          `Failed to ${employeeLevel ? "update" : "create"} employee level.`,
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
        {employeeLevel ? "Edit Employee Level" : "Add Employee Level"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">Level Name *</label>
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
            <label className="block mb-1">Level Index</label>
            <Controller
              name="level_index"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={
                    field.value === null || field.value === undefined
                      ? ""
                      : field.value
                  }
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                  error={!!errors.level_index}
                  helperText={errors.level_index?.message}
                  className="bg-white"
                  InputProps={{ className: "h-10" }}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.onChange(value === "" ? null : Number(value));
                    trigger("level_index");
                  }}
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
          ) : employeeLevel ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeLevelFormPopup;
