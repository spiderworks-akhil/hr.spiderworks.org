"use client";

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
  Grid,
  Slide,
} from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

const validationSchema = yup.object().shape({
  name: yup.string().required("Level name is required").trim(),
});

const EmployeeLevelFormPopup = ({
  open,
  onClose,
  onSuccess,
  employeeLevel,
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
    },
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "" });
      return;
    }

    if (employeeLevel) {
      reset({ name: employeeLevel.name || "" });
    } else {
      reset({ name: "" });
    }
  }, [employeeLevel, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
      };

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
          `Failed to ${
            employeeLevel ? "update" : "create"
          } employee level. Please try again.`
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
      TransitionProps={{ direction: "up" }}
      sx={{
        "& .MuiDialog-paper": {
          margin: 0,
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "38%",
          maxWidth: "none",
          height: "100%",
          borderRadius: 0,
          maxHeight: "100%",
        },
      }}
    >
      <DialogTitle>
        {employeeLevel ? "Edit Employee Level" : "Add Employee Level"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Level Name
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
                  InputProps={{ style: { height: "40px" } }}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
        </Grid>
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
