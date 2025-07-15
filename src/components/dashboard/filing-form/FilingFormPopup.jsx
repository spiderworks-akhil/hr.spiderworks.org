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
  Slide,
  Box,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const Transition = Slide;

const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required").trim(),
  description: yup.string().nullable().trim(),
  filing_instructions: yup.string().nullable().trim(),
  last_filing_date: yup
    .date()
    .nullable()
    .typeError("Last filing date must be a valid date"),
  next_due_date: yup
    .date()
    .nullable()
    .typeError("Next due date must be a valid date"),
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

const FilingFormPopup = ({ open, onClose, onSuccess, compliance }) => {
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
      title: "",
      description: "",
      last_filing_date: null,
      next_due_date: null,
      filing_instructions: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    console.log("Form errors:", errors);
  }, [errors]);

  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        description: "",
        last_filing_date: null,
        next_due_date: null,
        filing_instructions: "",
      });
      setError(null);
      return;
    }

    if (compliance) {
      reset({
        title: compliance.title || "",
        description: compliance.description || "",
        last_filing_date: compliance.last_filing_date
          ? moment(compliance.last_filing_date)
          : null,
        next_due_date: compliance.next_due_date
          ? moment(compliance.next_due_date)
          : null,
        filing_instructions: compliance.filing_instructions || "",
      });
    } else {
      reset({
        title: "",
        description: "",
        last_filing_date: null,
        next_due_date: null,
        filing_instructions: "",
      });
    }
  }, [compliance, open, reset]);

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
        last_filing_date: formatDateSimple(formData.last_filing_date),
        next_due_date: formatDateSimple(formData.next_due_date),
        filing_instructions: formData.filing_instructions?.trim() || null,
        ...(compliance
          ? { updated_by: session?.user?.id || null }
          : {
              created_by: session?.user?.id || null,
              updated_by: session?.user?.id || null,
            }),
      };

      const method = compliance ? "PUT" : "POST";
      const url = compliance
        ? `${BASE_URL}/api/compliance/update/${compliance.id}`
        : `${BASE_URL}/api/compliance/create`;

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
            `Failed to ${compliance ? "update" : "create"} compliance record`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Compliance record ${
            compliance ? "updated" : "created"
          } successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${compliance ? "updating" : "creating"} compliance record:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${compliance ? "update" : "create"} compliance record`
      );
      toast.error(
        err.message ||
          `Failed to ${compliance ? "update" : "create"} compliance record.`,
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
        TransitionProps={{ direction: "up" }}
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
          {compliance ? "Edit Compliance Record" : "Add Compliance Record"}
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
                    InputProps={{ className: "h-10" }}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    className="bg-white"
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
              <label className="block mb-1">Filing Instructions</label>
              <Controller
                name="filing_instructions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    error={!!errors.filing_instructions}
                    helperText={errors.filing_instructions?.message}
                    className="bg-white"
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
                <label className="block mb-1">Last Filing Date</label>
                <Controller
                  name="last_filing_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      format="DD-MM-YYYY"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        trigger("last_filing_date");
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.last_filing_date,
                          helperText: errors.last_filing_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
                {errors.last_filing_date && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {errors.last_filing_date?.message}
                  </span>
                )}
              </Box>

              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Next Due Date</label>
                <Controller
                  name="next_due_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      format="DD-MM-YYYY"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        trigger("next_due_date");
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.next_due_date,
                          helperText: errors.next_due_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
                {errors.next_due_date && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {errors.next_due_date?.message}
                  </span>
                )}
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
            ) : compliance ? (
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

export default FilingFormPopup;
