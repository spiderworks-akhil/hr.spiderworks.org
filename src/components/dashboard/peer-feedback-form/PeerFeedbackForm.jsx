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
import Select from "react-select";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

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
  });

  const fetchEmployees = async (search = "") => {
    try {
      const query = search ? `?keyword=${encodeURIComponent(search)}` : "";
      const response = await fetch(`${BASE_URL}/api/employees/list${query}`);
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
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({ feedback: "", provided_by: null, provided_to: null });
      setEmployeeSearch("");
      setEmployees([]);
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
      reset({ feedback: "", provided_by: null, provided_to: null });
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
      <DialogTitle>{feedback ? "Edit Feedback" : "Add Feedback"}</DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Feedback
            </label>
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
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Provided By
            </label>
            <Controller
              name="provided_by"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={employees}
                  onInputChange={handleEmployeeSearch}
                  placeholder="Select employee"
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      height: "40px",
                      minHeight: "40px",
                      borderColor: errors.provided_by
                        ? "#d32f2f"
                        : base.borderColor,
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      height: "40px",
                      padding: "0 8px",
                    }),
                    input: (base) => ({
                      ...base,
                      margin: 0,
                      padding: 0,
                    }),
                  }}
                />
              )}
            />
            {errors.provided_by && (
              <div className="text-red-600 text-sm mt-1">
                {errors.provided_by.message}
              </div>
            )}
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Provided To
            </label>
            <Controller
              name="provided_to"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={employees}
                  onInputChange={handleEmployeeSearch}
                  placeholder="Select employee"
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      height: "40px",
                      minHeight: "40px",
                      borderColor: errors.provided_to
                        ? "#d32f2f"
                        : base.borderColor,
                    }),
                    valueContainer: (base) => ({
                      ...base,
                      height: "40px",
                      padding: "0 8px",
                    }),
                    input: (base) => ({
                      ...base,
                      margin: 0,
                      padding: 0,
                    }),
                  }}
                />
              )}
            />
            {errors.provided_to && (
              <div className="text-red-600 text-sm mt-1">
                {errors.provided_to.message}
              </div>
            )}
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
