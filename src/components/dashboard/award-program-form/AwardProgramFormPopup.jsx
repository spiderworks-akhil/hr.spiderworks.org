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
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required").trim(),
  description: yup.string().nullable().trim(),
  expiry_date: yup.date().nullable(),
  thumbnail: yup
    .mixed()
    .nullable()
    .test("fileSize", "Image size must not exceed 5 MB", (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test("fileType", "Unsupported file type", (value) => {
      if (!value) return true;
      return allowedTypes.includes(value.type);
    }),
  is_active: yup.boolean().required(),
});

const AwardProgramFormPopup = ({ open, onClose, onSuccess, awardProgram }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      expiry_date: null,
      thumbnail: null,
      is_active: false,
    },
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        description: "",
        expiry_date: null,
        thumbnail: null,
        is_active: false,
      });
      setError(null);
      return;
    }

    if (awardProgram) {
      reset({
        title: awardProgram.title || "",
        description: awardProgram.description || "",
        expiry_date: awardProgram.expiry_date
          ? moment(awardProgram.expiry_date, "YYYY-MM-DD")
          : null,
        thumbnail: null,
        is_active: awardProgram.is_active || false,
      });
    } else {
      reset({
        title: "",
        description: "",
        expiry_date: null,
        thumbnail: null,
        is_active: false,
      });
    }
  }, [awardProgram, open, reset]);

  const formatDateSimple = (date) => {
    if (!date) return null;
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : null;
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const formDataPayload = new FormData();
      formDataPayload.append("title", formData.title.trim());
      if (formData.description) {
        formDataPayload.append("description", formData.description.trim());
      }
      const formattedDate = formatDateSimple(formData.expiry_date);
      if (formattedDate) {
        formDataPayload.append("expiry_date", formattedDate);
      }
      if (formData.thumbnail) {
        formDataPayload.append("thumbnail", formData.thumbnail);
      }
      formDataPayload.append("is_active", formData.is_active ? "1" : "0");

      const method = awardProgram ? "PUT" : "POST";
      const url = awardProgram
        ? `${BASE_URL}/api/award-programs/update/${awardProgram.id}`
        : `${BASE_URL}/api/award-programs/create`;

      const response = await fetch(url, {
        method,
        body: formDataPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${awardProgram ? "update" : "create"} award program`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Award program ${awardProgram ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${awardProgram ? "updating" : "creating"} award program:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            awardProgram ? "update" : "create"
          } award program. Please try again.`
      );
      toast.error(
        err.message ||
          `Failed to ${awardProgram ? "update" : "create"} award program.`,
        {
          position: "top-right",
        }
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
            width: "38%",
            maxWidth: "none",
            height: "100%",
            borderRadius: 0,
            maxHeight: "100%",
          },
        }}
      >
        <DialogTitle>
          {awardProgram ? "Edit Award Program" : "Add Award Program"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Title
              </label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Description
              </label>
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
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Expiry Date
              </label>
              <Controller
                name="expiry_date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={(newValue) => {
                      field.onChange(newValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          style: { height: "40px" },
                        }}
                        error={!!errors.expiry_date}
                        helperText={errors.expiry_date?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Thumbnail Upload
              </label>
              <Controller
                name="thumbnail"
                control={control}
                render={({ field }) => (
                  <input
                    type="file"
                    accept={allowedTypes.join(",")}
                    onChange={(e) => {
                      const file = e.target.files[0] || null;
                      setValue("thumbnail", file, { shouldValidate: true });
                    }}
                    style={{ width: "100%", padding: "8px" }}
                  />
                )}
              />
              {errors.thumbnail && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {errors.thumbnail?.message}
                </span>
              )}
              {awardProgram?.thumbnail && (
                <span
                  style={{
                    display: "block",
                    marginTop: "8px",
                    fontSize: "14px",
                  }}
                >
                  Existing thumbnail: {awardProgram.thumbnail.split("/").pop()}
                </span>
              )}
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Is Active"
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
            ) : awardProgram ? (
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

export default AwardProgramFormPopup;
