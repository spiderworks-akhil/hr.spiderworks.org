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
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

const validationSchema = yup.object().shape({
  title: yup.string().required("Title is required").trim(),
  description: yup.string().nullable().trim(),
  awarder_date: yup.date().nullable(),
  employee_id: yup.number().nullable().required("Employee is required"),
  award_program_id: yup
    .number()
    .nullable()
    .required("Award Program is required"),
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

const AwardWinnerFormPopup = ({ open, onClose, onSuccess, awardWinner }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [awardPrograms, setAwardPrograms] = useState([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      awarder_date: null,
      employee_id: null,
      award_program_id: null,
    },
    resolver: yupResolver(validationSchema),
  });

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
  }));

  const awardProgramOptions = awardPrograms.map((program) => ({
    value: program.id,
    label: program.title,
  }));

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/list`);
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setEmployees(data.data?.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees.", { position: "top-right" });
    }
  };

  const fetchAwardPrograms = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/award-programs/list`);
      if (!response.ok) {
        throw new Error("Failed to fetch award programs");
      }
      const data = await response.json();
      setAwardPrograms(data.data?.awardPrograms || []);
    } catch (error) {
      console.error("Failed to fetch award programs:", error);
      toast.error("Failed to load award programs.", { position: "top-right" });
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchAwardPrograms();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({
        title: "",
        description: "",
        awarder_date: null,
        employee_id: null,
        award_program_id: null,
      });
      setError(null);
      return;
    }

    if (awardWinner) {
      reset({
        title: awardWinner.title || "",
        description: awardWinner.description || "",
        awarder_date: awardWinner.awarder_date
          ? moment(awardWinner.awarder_date)
          : null,
        employee_id: awardWinner.employee_id || null,
        award_program_id: awardWinner.award_program_id || null,
      });
    } else {
      reset({
        title: "",
        description: "",
        awarder_date: null,
        employee_id: null,
        award_program_id: null,
      });
    }
  }, [awardWinner, open, reset]);

  const formatDateSimple = (date) => {
    if (!date) return null;
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.isValid() ? momentDate.toISOString() : null;
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        awarder_date: formatDateSimple(formData.awarder_date),
        employee_id: formData.employee_id || null,
        award_program_id: formData.award_program_id || null,
      };

      const method = awardWinner ? "PUT" : "POST";
      const url = awardWinner
        ? `${BASE_URL}/api/award-winner/update/${awardWinner.id}`
        : `${BASE_URL}/api/award-winner/create`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(
          errorData.message ||
            `Failed to ${awardWinner ? "update" : "create"} award winner`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Award winner ${awardWinner ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${awardWinner ? "updating" : "creating"} award winner:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            awardWinner ? "update" : "create"
          } award winner. Please try again.`
      );
      toast.error(
        err.message ||
          `Failed to ${awardWinner ? "update" : "create"} award winner.`,
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
          {awardWinner ? "Edit Award Winner" : "Add Award Winner"}
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
                Awarder Date
              </label>
              <Controller
                name="awarder_date"
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
                        error={!!errors.awarder_date}
                        helperText={errors.awarder_date?.message}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Employee
              </label>
              <Controller
                name="employee_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      options={employeeOptions}
                      value={
                        employeeOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      styles={customSelectStyles}
                      placeholder="Select Employee..."
                      isClearable
                    />
                    {errors.employee_id && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {errors.employee_id?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Award Program
              </label>
              <Controller
                name="award_program_id"
                control={control}
                render={({ field }) => (
                  <div>
                    <Select
                      options={awardProgramOptions}
                      value={
                        awardProgramOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(selected) =>
                        field.onChange(selected ? selected.value : null)
                      }
                      styles={customSelectStyles}
                      placeholder="Select Award Program..."
                      isClearable
                    />
                    {errors.award_program_id && (
                      <span style={{ color: "red", fontSize: "12px" }}>
                        {errors.award_program_id?.message}
                      </span>
                    )}
                  </div>
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
            ) : awardWinner ? (
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

export default AwardWinnerFormPopup;
