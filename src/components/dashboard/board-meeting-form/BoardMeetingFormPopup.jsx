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

const Transition = ({ children, ...props }) => (
  <Slide {...props} direction="up">
    {children}
  </Slide>
);

const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required").trim(),
  date: yup.date().nullable().typeError("Date must be a valid date"),
  meeting_location: yup.string().nullable().trim(),
  participants: yup.string().nullable().trim(),
  agenda: yup.string().nullable().trim(),
  meeting_minutes: yup.string().nullable().trim(),
});

const BoardMeetingFormPopup = ({ open, onClose, onSuccess, boardMeeting }) => {
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
      date: null,
      meeting_location: "",
      participants: "",
      agenda: "",
      meeting_minutes: "",
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
        date: null,
        meeting_location: "",
        participants: "",
        agenda: "",
        meeting_minutes: "",
      });
      setError(null);
      return;
    }

    if (boardMeeting) {
      reset({
        title: boardMeeting.title || "",
        date: boardMeeting.date
          ? moment(boardMeeting.date, "YYYY-MM-DD")
          : null,
        meeting_location: boardMeeting.meeting_location || "",
        participants: boardMeeting.participants || "",
        agenda: boardMeeting.agenda || "",
        meeting_minutes: boardMeeting.meeting_minutes || "",
      });
    } else {
      reset({
        title: "",
        date: null,
        meeting_location: "",
        participants: "",
        agenda: "",
        meeting_minutes: "",
      });
    }
  }, [boardMeeting, open, reset]);

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
        date: formatDateSimple(formData.date),
        meeting_location: formData.meeting_location?.trim() || null,
        participants: formData.participants?.trim() || null,
        agenda: formData.agenda?.trim() || null,
        meeting_minutes: formData.meeting_minutes?.trim() || null,
        created_by: null,
        updated_by: null,
      };

      const method = boardMeeting ? "PUT" : "POST";
      const url = boardMeeting
        ? `${BASE_URL}/api/board-meeting/update/${boardMeeting.id}`
        : `${BASE_URL}/api/board-meeting/create`;

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
              boardMeeting ? "update" : "create"
            } board meeting record`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Board meeting record ${
            boardMeeting ? "updated" : "created"
          } successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${boardMeeting ? "updating" : "creating"} board meeting record:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${boardMeeting ? "update" : "create"} board meeting record`
      );
      toast.error(
        err.message ||
          `Failed to ${
            boardMeeting ? "update" : "create"
          } board meeting record.`,
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
          {boardMeeting
            ? "Edit Board Meeting Record"
            : "Add Board Meeting Record"}
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
              <Box flex={1} minWidth={0}>
                <label className="block mb-1">Location</label>
                <Controller
                  name="meeting_location"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.meeting_location}
                      helperText={errors.meeting_location?.message}
                      className="bg-white"
                    />
                  )}
                />
              </Box>
            </Box>

            <Box>
              <label className="block mb-1">Agenda</label>
              <Controller
                name="agenda"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    error={!!errors.agenda}
                    helperText={errors.agenda?.message}
                    className="bg-white"
                  />
                )}
              />
            </Box>

            <Box>
              <label className="block mb-1">Meeting Minutes</label>
              <Controller
                name="meeting_minutes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    multiline
                    rows={4}
                    error={!!errors.meeting_minutes}
                    helperText={errors.meeting_minutes?.message}
                    className="bg-white"
                  />
                )}
              />
            </Box>

            <Box>
              <label className="block mb-1">Participants</label>
              <Controller
                name="participants"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.participants}
                    helperText={errors.participants?.message}
                    className="bg-white"
                  />
                )}
              />
            </Box>

            <Box>
              <label className="block mb-1">Date</label>
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
              {errors.date && (
                <span className="text-red-600 text-xs mt-1 block">
                  {errors.date?.message}
                </span>
              )}
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
            ) : boardMeeting ? (
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

export default BoardMeetingFormPopup;
