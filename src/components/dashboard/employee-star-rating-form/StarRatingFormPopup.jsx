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
} from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Select from "react-select";
import { FaStar } from "react-icons/fa";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const validationSchema = yup.object().shape({
  label: yup.string().required("Label is required").trim(),
  given_by_id: yup
    .number()
    .required("Given By is required")
    .typeError("Given By is required"),
  given_to_id: yup
    .number()
    .required("Given To is required")
    .typeError("Given To is required"),
  star_type: yup.string().oneOf(["green", "red"]).nullable(),
  star_count: yup.number().min(0).max(5).integer().nullable(),
});

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    border: "1px solid #ccc",
    borderRadius: "4px",
    minHeight: "40px",
    boxShadow: "none",
    "&:hover": { border: "1px solid #ccc" },
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
    "&:hover": { backgroundColor: state.isSelected ? "#2ac4ab" : "#e6f7f5" },
  }),
};

const StarRatingFormPopup = ({ open, onClose, onSuccess, starRating }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [tempStarCount, setTempStarCount] = useState(0);
  const [hoverStarCount, setHoverStarCount] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      label: "",
      given_by_id: null,
      given_to_id: null,
      star_type: "green",
      star_count: 0,
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const starType = watch("star_type");

  const employeeOptions = employees.map((employee) => ({
    value: employee.id,
    label: employee.name,
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

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      reset({
        label: "",
        given_by_id: null,
        given_to_id: null,
        star_type: "green",
        star_count: 0,
      });
      setError(null);
      setTempStarCount(0);
      setHoverStarCount(null);
      return;
    }

    if (starRating) {
      reset({
        label: starRating.label || "",
        given_by_id: starRating.given_by_id || null,
        given_to_id: starRating.given_to_id || null,
        star_type: starRating.star_type?.toLowerCase() || "green",
        star_count: starRating.star_count || 0,
      });
      setTempStarCount(starRating.star_count || 0);
    } else {
      reset({
        label: "",
        given_by_id: null,
        given_to_id: null,
        star_type: "green",
        star_count: 0,
      });
      setTempStarCount(0);
    }
  }, [starRating, open, reset]);

  const handleStarClick = (count) => {
    const newCount = tempStarCount === count ? 0 : count;
    setTempStarCount(newCount);
    setValue("star_count", newCount, { shouldValidate: true });
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        label: formData.label.trim(),
        given_by_id: formData.given_by_id,
        given_to_id: formData.given_to_id,
        star_type: formData.star_type ? formData.star_type.toUpperCase() : null,
        star_count: formData.star_count || 0,
        created_by: null,
        updated_by: null,
      };

      const method = starRating ? "PUT" : "POST";
      const url = starRating
        ? `${BASE_URL}/api/star-rating/update/${starRating.id}`
        : `${BASE_URL}/api/star-rating/create`;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${starRating ? "update" : "create"} star rating`
        );
      }

      const data = await response.json();
      toast.success(
        data?.message ||
          `Star rating ${starRating ? "updated" : "created"} successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${starRating ? "updating" : "creating"} star rating:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${starRating ? "update" : "create"} star rating`
      );
      toast.error(
        err.message ||
          `Failed to ${starRating ? "update" : "create"} star rating.`,
        { position: "top-right" }
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
        {starRating ? "Edit Star Rating" : "Add Star Rating"}
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
              <label className="block mb-1">Given By *</label>
              <Controller
                name="given_by_id"
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
                      placeholder="Select Given By..."
                      isClearable
                    />
                    {errors.given_by_id && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.given_by_id?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <label className="block mb-1">Given To *</label>
              <Controller
                name="given_to_id"
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
                      placeholder="Select Given To..."
                      isClearable
                    />
                    {errors.given_to_id && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.given_to_id?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Box>
          </Box>

          <Box
            display="flex"
            flexDirection={{ xs: "column", md: "row" }}
            gap={2}
          >
            <Box flex={1} minWidth={0}>
              <label className="block mb-1">Label *</label>
              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    error={!!errors.label}
                    helperText={errors.label?.message}
                    className="bg-white"
                    InputProps={{ className: "h-10" }}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </Box>
            <Box flex={1} minWidth={0}>
              <label className="block mb-1">Star Type</label>
              <Controller
                name="star_type"
                control={control}
                render={({ field }) => (
                  <div>
                    <div className="flex gap-2">
                      <Button
                        variant={field.value === "green" ? "" : "outlined"}
                        sx={{
                          backgroundColor:
                            field.value === "green" ? "#22c55e" : "transparent",
                          color: field.value === "green" ? "white" : "#22c55e",
                          borderColor: "#22c55e",
                          "&:hover": {
                            backgroundColor:
                              field.value === "green" ? "#16a34a" : "#f0fdf4",
                            borderColor: "#16a34a",
                          },
                        }}
                        onClick={() => field.onChange("green")}
                      >
                        Green
                      </Button>
                      <Button
                        variant={field.value === "red" ? "" : "outlined"}
                        sx={{
                          backgroundColor:
                            field.value === "red" ? "#ef5350" : "transparent",
                          color: field.value === "red" ? "white" : "#ef5350",
                          borderColor: "#ef5350",
                          "&:hover": {
                            backgroundColor:
                              field.value === "red" ? "#e53935" : "#ffebee",
                            borderColor: "#e53935",
                          },
                        }}
                        onClick={() => field.onChange("red")}
                      >
                        Red
                      </Button>
                    </div>
                    {errors.star_type && (
                      <span className="text-red-600 text-xs mt-1 block">
                        {errors.star_type?.message}
                      </span>
                    )}
                  </div>
                )}
              />
            </Box>
          </Box>

          <Box>
            <label className="block mb-1">Star Count</label>
            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                  <FaStar
                    key={index}
                    className={`w-6 h-6 cursor-pointer ${
                      starValue <= (hoverStarCount || tempStarCount)
                        ? starType === "green"
                          ? "text-green-500"
                          : "text-red-500"
                        : "text-gray-300"
                    }`}
                    onClick={() => handleStarClick(starValue)}
                    onMouseEnter={() => setHoverStarCount(starValue)}
                    onMouseLeave={() => setHoverStarCount(null)}
                  />
                );
              })}
            </div>
            {errors.star_count && (
              <span className="text-red-600 text-xs mt-1 block">
                {errors.star_count?.message}
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
          ) : starRating ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StarRatingFormPopup;
