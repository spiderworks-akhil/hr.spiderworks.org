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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const validationSchema = yup.object().shape({
  date: yup
    .date()
    .required("Date is required")
    .typeError("Date must be a valid date"),
  is_holiday: yup
    .number()
    .required("Holiday status is required")
    .oneOf([0, 1], "Holiday status must be Yes or No"),
  remarks: yup.string().trim().optional(),
});

const CompanyCalendarFormPopup = ({ open, onClose, onSuccess, calendar }) => {
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
      date: null,
      is_holiday: null,
      remarks: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({
        date: null,
        is_holiday: null,
        remarks: "",
      });
      setError(null);
      return;
    }

    if (calendar) {
      reset({
        date: calendar.date ? moment(calendar.date) : null,
        is_holiday: calendar.is_holiday ?? null,
        remarks: calendar.remarks || "",
      });
    } else {
      reset({
        date: null,
        is_holiday: null,
        remarks: "",
      });
    }
  }, [calendar, open, reset]);

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
        date: formatDateSimple(formData.date),
        is_holiday: formData.is_holiday,
        remarks: formData.remarks ? formData.remarks.trim() : null,
        ...(calendar
          ? { updated_by: session?.user?.id || null }
          : {
              created_by: session?.user?.id || null,
              updated_by: session?.user?.id || null,
            }),
      };

      const method = calendar ? "PUT" : "POST";
      const url = calendar
        ? `${BASE_URL}/api/company-calendar/update/${calendar.id}`
        : `${BASE_URL}/api/company-calendar/create`;

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
            `Failed to ${calendar ? "update" : "create"} company calendar`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Company calendar ${calendar ? "updated" : "created"} successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${calendar ? "updating" : "creating"} company calendar:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${calendar ? "update" : "create"} company calendar`
      );
      toast.error(
        err.message ||
          `Failed to ${calendar ? "update" : "create"} company calendar.`,
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
          {calendar ? "Edit Calendar Entry" : "Add Calendar Entry"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}

          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Box>
              <label className="block mb-1">Date *</label>
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                      trigger("date");
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        error: !!errors.date,
                        helperText: errors.date?.message,
                        className: "bg-white",
                        InputProps: { className: "h-10" },
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" className="mb-1">
                  Holiday *
                </FormLabel>
                <Controller
                  name="is_holiday"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      value={field.value !== null ? field.value.toString() : ""}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value));
                        trigger("is_holiday");
                      }}
                    >
                      <FormControlLabel
                        value="1"
                        control={<Radio size="small" />}
                        label="Yes"
                      />
                      <FormControlLabel
                        value="0"
                        control={<Radio size="small" />}
                        label="No"
                      />
                    </RadioGroup>
                  )}
                />
                {errors.is_holiday && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {errors.is_holiday.message}
                  </span>
                )}
              </FormControl>
            </Box>

            <Box>
              <label className="block mb-1">Remarks</label>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    error={!!errors.remarks}
                    helperText={errors.remarks?.message}
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
            ) : calendar ? (
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

export default CompanyCalendarFormPopup;
