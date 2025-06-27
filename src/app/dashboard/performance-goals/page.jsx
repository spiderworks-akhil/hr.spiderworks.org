"use client";

import { useState, useEffect, useRef } from "react";
import { MdEdit, MdDelete, MdRateReview } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Popover,
  Typography,
  Box,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Slider,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import { useForm, Controller, trigger } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";

const PerformanceGoalFormPopup = dynamic(
  () =>
    import(
      "@/components/dashboard/performance-goal-form/PerformanceGoalFormPopup"
    ),
  { ssr: false }
);

const validationSchema = yup.object().shape({
  result: yup.string().required("Status is required"),
  result_remarks: yup.string().nullable().trim(),
  result_percentage_achieved: yup.number().min(0).max(100).required(),
  achieved_date: yup.date().required("Date Achieved is required"),
  green_star_count: yup.number().min(0).max(5).integer().nullable(),
  red_star_count: yup.number().min(0).max(5).integer().nullable(),
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

const StarRating = ({ value, onChange, color, disabled }) => {
  const handleClick = (index) => {
    if (disabled) return;
    const newValue = value === index + 1 ? 0 : index + 1;
    onChange(newValue);
  };

  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <FaStar
          key={index}
          size={24}
          color={index < value ? color : "#e4e5e9"}
          onClick={() => handleClick(index)}
          className={disabled ? "cursor-default" : "cursor-pointer"}
        />
      ))}
    </Box>
  );
};

const PerformanceGoals = () => {
  const [performanceGoals, setPerformanceGoals] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [reviewGoal, setReviewGoal] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const initialStarCounts = useRef({ green: 0, red: 0 });
  const initialValues = useRef({ result: null, percentage: 0 });
  const lastResult = useRef(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      result: null,
      result_remarks: "",
      result_percentage_achieved: 0,
      achieved_date: null,
      green_star_count: 0,
      red_star_count: 0,
      reviewer_id: null,
    },
    resolver: yupResolver(validationSchema),
  });

  const result = watch("result");

  const columns = [
    { field: "title", headerName: "Title", width: 200 },

    {
      field: "target_date",
      headerName: "Target Date",
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "reviewer",
      headerName: "Reviewer",
      width: 150,
      renderCell: (params) => (
        <span>
          {params.row.reviewer?.name && params.row.reviewer.name.trim() !== ""
            ? params.row.reviewer.name
            : "-"}
        </span>
      ),
    },
    {
      field: "assigned_to",
      headerName: "Assigned To",
      width: 200,
      renderCell: (params) => (
        <span>
          {params.row.assignments?.length > 0
            ? params.row.assignments
                .map((assignment) => assignment.user.name)
                .join(", ")
            : "-"}
        </span>
      ),
    },
    {
      field: "result",
      headerName: "Status",
      width: 150,
      renderCell: (params) => (
        <span>
          {params.value
            ? params.value
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "-"}
        </span>
      ),
    },
    {
      field: "review",
      headerName: "Review",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenReviewDialog(params.row)}
          aria-label="Review performance goal"
          className="p-1"
        >
          <MdRateReview className="w-5 h-5 text-blue-500" />
        </button>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit performance goal"
          className="p-1"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={(event) => handleOpenDeletePopover(event, params.row)}
          aria-label="Delete performance goal"
          className="p-1"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditGoal(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (goal) => {
    setEditGoal(goal);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditGoal(null);
  };

  const handleOpenReviewDialog = (goal) => {
    setReviewGoal(goal);
    setOpenReviewDialog(true);
    const initialGreen = goal.green_star_count || 0;
    const initialRed = goal.red_star_count || 0;
    const initialResult = goal.result || null;
    const initialPercentage = goal.result_percentage_achieved || 0;
    reset({
      result: goal.result || null,
      result_remarks: goal.result_remarks || "",
      result_percentage_achieved: goal.result_percentage_achieved || 0,
      achieved_date: goal.achieved_date
        ? moment(goal.achieved_date, "YYYY-MM-DD")
        : null,
      green_star_count: initialGreen,
      red_star_count: initialRed,
      reviewer_id: goal.reviewer?.id || null,
    });
    initialStarCounts.current = { green: initialGreen, red: initialRed };
    initialValues.current = {
      result: initialResult,
      percentage: initialPercentage,
    };
    lastResult.current = initialResult;
  };

  const handleCloseReviewDialog = () => {
    setOpenReviewDialog(false);
    setReviewGoal(null);
    reset();
    setReviewError(null);
    initialStarCounts.current = { green: 0, red: 0 };
    initialValues.current = { result: null, percentage: 0 };
    lastResult.current = null;
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setOpenReviewDialog(false);
    setEditGoal(null);
    setReviewGoal(null);
    fetchPerformanceGoals(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, goal) => {
    setAnchorEl(event.currentTarget);
    setGoalToDelete(goal);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setGoalToDelete(null);
  };

  const handleDeletePerformanceGoal = async () => {
    if (!goalToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/performance-goal/delete/${goalToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete performance goal"
        );
      }

      const data = await response.json();
      toast.success(data.message || "Performance goal deleted successfully!", {
        position: "top-right",
      });

      await fetchPerformanceGoals(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete performance goal:", error);
      setFetchError(
        error.message || "Failed to delete performance goal. Please try again."
      );
      toast.error(error.message || "Failed to delete performance goal.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceGoals = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/performance-goal/list?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch performance goals");
      }

      const data = await response.json();
      const goals = (data.data?.performanceGoals || [])
        .filter((goal) => {
          if (!goal || typeof goal !== "object" || !goal.id) {
            console.warn("Invalid performance goal entry:", goal);
            return false;
          }
          return true;
        })
        .map((goal) => ({
          ...goal,
          description: goal.description || null,
          target_date: goal.target_date || null,
          reviewer: goal.reviewer || null,
          reviewer_id: goal.reviewer?.id || null,
          assignments: goal.assignments || [],
          result: goal.result || null,
          result_remarks: goal.result_remarks || null,
          result_percentage_achieved: goal.result_percentage_achieved || 0,
          achieved_date: goal.achieved_date || null,
          green_star_count: goal.green_star_count || 0,
          red_star_count: goal.red_star_count || 0,
        }));

      setPerformanceGoals(goals);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch performance goals:", error);
      setFetchError("Failed to load performance goals. Please try again.");
      setPerformanceGoals([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceGoals(page, searchQuery);
  }, [page, searchQuery]);

  useEffect(() => {
    if (result !== lastResult.current) {
      const initialResult = initialValues.current.result;
      const initialPercentage = initialValues.current.percentage;

      if (
        result === initialResult &&
        initialPercentage >= 0 &&
        initialPercentage <= 100
      ) {
        setValue("result_percentage_achieved", initialPercentage);
      } else {
        if (result === "ACHIEVED") {
          setValue("result_percentage_achieved", 100);
        } else if (result === "PARTIALLY_ACHIEVED") {
          setValue("result_percentage_achieved", 50);
        } else if (["NOT_ACHIEVED", "NOT_STARTED"].includes(result)) {
          setValue("result_percentage_achieved", 0);
        } else {
          setValue("result_percentage_achieved", 0);
        }
      }

      if (result === "ACHIEVED") {
        setValue("red_star_count", 0);
        setValue("green_star_count", initialStarCounts.current.green || 0);
      } else if (result === "PARTIALLY_ACHIEVED") {
        setValue("green_star_count", initialStarCounts.current.green || 0);
        setValue("red_star_count", initialStarCounts.current.red || 0);
      } else if (["NOT_ACHIEVED", "NOT_STARTED"].includes(result)) {
        setValue("green_star_count", 0);
        setValue("red_star_count", initialStarCounts.current.red || 0);
      }

      lastResult.current = result;
    }
  }, [result, setValue]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const formatDateSimple = (date) => {
    if (!date) return null;
    const momentDate = moment.isMoment(date) ? date : moment(date);
    return momentDate.isValid() ? momentDate.format("YYYY-MM-DD") : null;
  };

  const onReviewSubmit = async (formData) => {
    try {
      setReviewLoading(true);
      setReviewError(null);

      const payload = {
        result: formData.result,
        result_remarks: formData.result_remarks?.trim() || null,
        result_percentage_achieved: formData.result_percentage_achieved || 0,
        achieved_date: formatDateSimple(formData.achieved_date),
        green_star_count: formData.green_star_count || 0,
        red_star_count: formData.red_star_count || 0,
        reviewer_id: formData.reviewer_id || null,
      };

      const response = await fetch(
        `${BASE_URL}/api/performance-goal/review/${reviewGoal.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to review performance goal"
        );
      }

      const data = await response.json();
      toast.success(data.message || "Performance goal reviewed successfully!", {
        position: "top-right",
      });

      handleSuccess();
    } catch (err) {
      console.error("Error reviewing performance goal:", err);
      setReviewError(err.message || "Failed to review performance goal");
      toast.error(err.message || "Failed to review performance goal.", {
        position: "top-right",
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const goalResultOptions = [
    { value: "NOT_STARTED", label: "Not Started" },
    { value: "ACHIEVED", label: "Achieved" },
    { value: "PARTIALLY_ACHIEVED", label: "Partially Achieved" },
    { value: "NOT_ACHIEVED", label: "Not Achieved" },
  ];

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No performance goals found
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="min-h-screen bg-white p-4">
        <Toaster position="top-right" reverseOrder={true} />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Performance Goals ({total})
          </h1>
          <button
            onClick={handleOpenAddDialog}
            className="bg-teal-500 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-teal-600"
          >
            <span>+ Add Performance Goal</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
          <input
            type="text"
            placeholder="Search Performance Goals"
            value={searchQuery}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <BeatLoader color="#2ac4ab" size={15} />
          </div>
        ) : fetchError ? (
          <div className="text-center text-red-600 py-10">{fetchError}</div>
        ) : (
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={performanceGoals}
              getRowId={(row) => row.id}
              columns={columns}
              autoHeight
              initialState={{
                pagination: { paginationModel: { page, pageSize: limit } },
              }}
              pagination
              paginationMode="server"
              rowCount={total}
              onPaginationModelChange={(newModel) => setPage(newModel.page)}
              loading={loading}
              sx={{
                border: 0,
                boxShadow: "none",
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "rgba(234, 248, 244, 0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(234, 248, 244, 0.8)",
                  },
                },
                "& .MuiDataGrid-cell": {
                  border: "none",
                },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "none",
                  borderBottom: "none",
                },
                "& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within, & .MuiDataGrid-columnHeader--sorted":
                  {
                    outline: "none",
                  },
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
                  outline: "none",
                },
              }}
              slots={{
                noRowsOverlay: CustomNoRowsOverlay,
              }}
              slotProps={{
                pagination: {
                  showRowsPerPage: false,
                },
              }}
            />
          </Paper>
        )}

        <PerformanceGoalFormPopup
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
          performanceGoal={editGoal}
        />

        <Dialog
          open={openReviewDialog}
          onClose={handleCloseReviewDialog}
          sx={{
            "& .MuiDialog-paper": {
              width: {
                xs: "90vw",
                sm: "500px",
              },
              maxHeight: "80vh",
              borderRadius: "8px",
            },
          }}
        >
          <DialogTitle className="text-lg font-semibold">
            Review Performance Goal
          </DialogTitle>

          <DialogContent className="overflow-y-auto">
            {reviewError && (
              <div className="text-red-600 mb-4">{reviewError}</div>
            )}

            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Box>
                <label className="block mb-1 text-sm font-medium mr-2">
                  Target:
                </label>
                <Typography>{reviewGoal?.title || "-"}</Typography>
              </Box>

              <Box>
                <label className="block mb-1 text-sm font-medium mr-2">
                  Assigned To:
                </label>
                <Typography>
                  {reviewGoal?.assignments?.length > 0
                    ? reviewGoal.assignments.map((a) => a.user.name).join(", ")
                    : "-"}
                </Typography>
              </Box>

              <Box>
                <label className="block mb-1 text-sm font-medium mr-2">
                  Target Date:
                </label>
                <Typography>
                  {reviewGoal?.target_date
                    ? moment(reviewGoal.target_date).format("DD-MM-YYYY")
                    : "-"}
                </Typography>
              </Box>

              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Result Remarks
                </label>
                <Controller
                  name="result_remarks"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      multiline
                      rows={3}
                      error={!!errors.result_remarks}
                      helperText={errors.result_remarks?.message}
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
                <Box flex={1}>
                  <label className="block mb-1 text-sm font-medium">
                    Status
                  </label>
                  <Controller
                    name="result"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={goalResultOptions}
                        value={
                          goalResultOptions.find(
                            (opt) => opt.value === field.value
                          ) || null
                        }
                        onChange={(selected) => {
                          field.onChange(selected ? selected.value : null);
                          trigger("result");
                        }}
                        styles={customSelectStyles}
                        placeholder="Select Status..."
                        isClearable
                        className="bg-white"
                      />
                    )}
                  />
                  {errors.result && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.result?.message}
                    </span>
                  )}
                </Box>

                <Box flex={1}>
                  <label className="block mb-1 text-sm font-medium">
                    Percentage Achieved
                  </label>
                  <Controller
                    name="result_percentage_achieved"
                    control={control}
                    render={({ field }) => (
                      <Box sx={{ px: 1 }}>
                        <Slider
                          value={field.value || 0}
                          onChange={(_, newValue) => {
                            field.onChange(newValue);
                            trigger("result_percentage_achieved");
                          }}
                          min={0}
                          max={100}
                          step={1}
                          valueLabelDisplay="auto"
                          sx={{ color: "#2ac4ab" }}
                        />
                      </Box>
                    )}
                  />
                  {errors.result_percentage_achieved && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.result_percentage_achieved?.message}
                    </span>
                  )}
                </Box>
              </Box>

              <Box>
                <label className="block mb-1 text-sm font-medium">
                  Date Achieved
                </label>
                <Controller
                  name="achieved_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={(newValue) => {
                        field.onChange(newValue);
                        trigger("achieved_date");
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.achieved_date,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
                {errors.achieved_date && (
                  <span className="text-red-600 text-xs mt-1 block">
                    {errors.achieved_date?.message}
                  </span>
                )}
              </Box>

              <Box
                display="flex"
                flexDirection={{ xs: "column", md: "row" }}
                gap={2}
              >
                <Box flex={1}>
                  <label className="block mb-1 text-sm font-medium">
                    Target Achieved (Green Stars)
                  </label>
                  <Controller
                    name="green_star_count"
                    control={control}
                    render={({ field }) => (
                      <StarRating
                        value={field.value || 0}
                        onChange={(value) => {
                          field.onChange(value);
                          trigger("green_star_count");
                        }}
                        color="#2ac4ab"
                        disabled={
                          ["NOT_ACHIEVED", "NOT_STARTED"].includes(result) ||
                          !result
                        }
                      />
                    )}
                  />
                  {errors.green_star_count && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.green_star_count?.message}
                    </span>
                  )}
                </Box>

                <Box flex={1}>
                  <label className="block mb-1 text-sm font-medium">
                    Target Not Achieved (Red Stars)
                  </label>
                  <Controller
                    name="red_star_count"
                    control={control}
                    render={({ field }) => (
                      <StarRating
                        value={field.value || 0}
                        onChange={(value) => {
                          field.onChange(value);
                          trigger("red_star_count");
                        }}
                        color="#ef5350"
                        disabled={result === "ACHIEVED" || !result}
                      />
                    )}
                  />
                  {errors.red_star_count && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.red_star_count?.message}
                    </span>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions
            sx={{ justifyContent: "justify-between", px: 3, pb: 3, pt: 2 }}
          >
            <Button
              onClick={handleCloseReviewDialog}
              sx={{
                backgroundColor: "#ffebee",
                color: "#ef5350",
                "&:hover": { backgroundColor: "#ffcdd2" },
                padding: "8px 16px",
                borderRadius: "8px",
              }}
              disabled={reviewLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(onReviewSubmit)}
              sx={{
                backgroundColor: "rgb(42,196,171)",
                color: "white",
                "&:hover": { backgroundColor: "rgb(36,170,148)" },
                padding: "8px 16px",
                borderRadius: "8px",
              }}
              disabled={reviewLoading}
            >
              {reviewLoading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseDeletePopover}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Box sx={{ p: 2, width: 260 }}>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to delete{" "}
              <strong className="font-bold">{goalToDelete?.title}</strong>?
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleCloseDeletePopover}
                sx={{
                  borderColor: "#ef5350",
                  color: "#ef5350",
                  "&:hover": { borderColor: "#e53935", color: "#e53935" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={handleDeletePerformanceGoal}
                color="error"
                disabled={loading}
              >
                {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
              </Button>
            </Box>
          </Box>
        </Popover>
      </div>
    </LocalizationProvider>
  );
};

export default PerformanceGoals;
