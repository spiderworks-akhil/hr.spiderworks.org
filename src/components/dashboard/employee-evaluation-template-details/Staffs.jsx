"use client";

import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Typography,
  Popover,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import { MdEdit, MdDelete, MdStar, MdStarBorder } from "react-icons/md";
import moment from "moment";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";

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

const Staffs = ({ template }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [evaluationResponses, setEvaluationResponses] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [evaluatorType, setEvaluatorType] = useState("employee");
  const [formData, setFormData] = useState({
    id: 0,
    evaluation_for_employee_id: "",
    evaluation_by_employee_id: "",
    evaluation_by_name: "",
    evaluation_by_email: "",
    template_id: template?.id || null,
  });
  const [employees, setEmployees] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [deletePopover, setDeletePopover] = useState({
    anchorEl: null,
    evaluationId: null,
  });
  const [evaluateDialogOpen, setEvaluateDialogOpen] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [ratings, setRatings] = useState({});
  const [descriptions, setDescriptions] = useState({});
  const [remarks, setRemarks] = useState("");
  const [improvements, setImprovements] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/employees/list?page=1&limit=1000`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setEmployees(data.data?.employees || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Failed to load employees. Please try again.", {
        position: "top-right",
      });
    }
  };

  const fetchEvaluationResponses = async (evaluationIds) => {
    try {
      const responses = {};
      for (const evalId of evaluationIds) {
        const response = await fetch(
          `${BASE_URL}/api/employee-evaluation-responses/list?page=1&limit=1000&employeeEvaluationId=${evalId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch responses for evaluation ${evalId}`);
        }
        const data = await response.json();
        responses[evalId] = data.data?.responses || [];
      }
      setEvaluationResponses((prev) => ({ ...prev, ...responses }));
    } catch (error) {
      console.error("Failed to fetch evaluation responses:", error);
      toast.error("Failed to load evaluation responses. Please try again.", {
        position: "top-right",
      });
    }
  };

  const fetchEvaluations = async (page, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-evaluations/list?page=${page + 1}&limit=100${
          search ? `&keyword=${encodeURIComponent(search)}` : ""
        }&templateId=${template.id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch evaluations");
      }
      const data = await response.json();
      const newEvaluations = data.data?.evaluations || [];
      setEvaluations(newEvaluations);
      setTotal(data.data?.total || 0);
      if (newEvaluations.length > 0) {
        await fetchEvaluationResponses(newEvaluations.map((e) => e.id));
      }
    } catch (error) {
      console.error("Failed to fetch evaluations:", error);
      setFetchError(
        error.message || "Failed to load evaluations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations(page, searchQuery);
    fetchEmployees();
  }, [page, searchQuery, template.id]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const handleOpenDialog = (mode, evalItem = null) => {
    setModalMode(mode);
    setEvaluatorType(
      evalItem?.evaluation_by_employee_id ? "employee" : "guest"
    );
    if (mode === "edit" && evalItem) {
      setFormData({
        id: evalItem.id,
        evaluation_for_employee_id: evalItem.evaluation_for_employee_id || "",
        evaluation_by_employee_id: evalItem.evaluation_by_employee_id || "",
        evaluation_by_name: evalItem.evaluation_by_name || "",
        evaluation_by_email: evalItem.evaluation_by_email || "",
        template_id: evalItem.template_id || template?.id || null,
      });
    } else {
      setFormData({
        id: 0,
        evaluation_for_employee_id: "",
        evaluation_by_employee_id: "",
        evaluation_by_name: "",
        evaluation_by_email: "",
        template_id: template?.id || null,
      });
    }
    setFormErrors({});
    setApiError(null);
    setSubmitted(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      id: 0,
      evaluation_for_employee_id: "",
      evaluation_by_employee_id: "",
      evaluation_by_name: "",
      evaluation_by_email: "",
      template_id: template?.id || null,
    });
    setEvaluatorType("employee");
    setFormErrors({});
    setApiError(null);
    setSubmitted(false);
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (value && formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (name === "evaluation_by_name" || name === "evaluation_by_email") {
      if (value && formErrors.guestFields) {
        setFormErrors((prev) => ({ ...prev, guestFields: "" }));
      }
    }
  };

  const handleEvaluatorTypeChange = (e) => {
    setEvaluatorType(e.target.value);
    setFormErrors({});
    setFormData((prev) => ({
      ...prev,
      evaluation_by_employee_id: prev.evaluation_by_employee_id,
      evaluation_by_name: prev.evaluation_by_name,
      evaluation_by_email: prev.evaluation_by_email,
      template_id: template?.id || null,
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.evaluation_for_employee_id) {
      errors.evaluation_for_employee_id = "Evaluated Employee is required";
    }

    if (modalMode === "edit" && evaluatorType === "employee") {
      if (!formData.evaluation_by_employee_id) {
        errors.evaluation_by_employee_id = "Evaluator Employee is required";
      }
    }

    if (modalMode === "edit" && evaluatorType === "guest") {
      if (!formData.evaluation_by_name && !formData.evaluation_by_email) {
        errors.guestFields = "Either Name or Email is required";
      }
    }

    return errors;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (
      evaluatorType === "guest" &&
      formData.evaluation_by_email &&
      !emailRegex.test(formData.evaluation_by_email)
    ) {
      setFormErrors({ email: "Please enter a valid email address" });
      return;
    }

    let payload;
    if (evaluatorType === "employee") {
      payload = {
        evaluation_for_employee_id: Number(formData.evaluation_for_employee_id),
        evaluation_by_employee_id: formData.evaluation_by_employee_id
          ? Number(formData.evaluation_by_employee_id)
          : null,
        evaluation_by_name: null,
        evaluation_by_email: null,
        template_id: template?.id || null,
      };
    } else {
      payload = {
        evaluation_for_employee_id: Number(formData.evaluation_for_employee_id),
        evaluation_by_employee_id: null,
        evaluation_by_name: formData.evaluation_by_name || null,
        evaluation_by_email: formData.evaluation_by_email || null,
        template_id: template?.id || null,
      };
    }

    const tempEvaluations = [...evaluations];
    if (modalMode === "add") {
      tempEvaluations.unshift({
        ...payload,
        id: Date.now(),
        created_at: new Date().toISOString(),
        evaluatedEmployee: employees.find(
          (emp) => emp.id === Number(formData.evaluation_for_employee_id)
        ),
        evaluatorEmployee:
          evaluatorType === "employee" && formData.evaluation_by_employee_id
            ? employees.find(
                (emp) => emp.id === Number(formData.evaluation_by_employee_id)
              )
            : null,
        template: template?.id ? { id: template.id } : null,
      });
    } else {
      const index = tempEvaluations.findIndex((e) => e.id === formData.id);
      if (index !== -1) {
        tempEvaluations[index] = {
          ...tempEvaluations[index],
          ...payload,
          evaluatedEmployee: employees.find(
            (emp) => emp.id === Number(formData.evaluation_for_employee_id)
          ),
          evaluatorEmployee:
            evaluatorType === "employee" && formData.evaluation_by_employee_id
              ? employees.find(
                  (emp) => emp.id === Number(formData.evaluation_by_employee_id)
                )
              : null,
          template: template?.id ? { id: template.id } : null,
        };
      }
    }
    setEvaluations(tempEvaluations);

    try {
      setLoading(true);
      setApiError(null);
      const url =
        modalMode === "add"
          ? `${BASE_URL}/api/employee-evaluations/create`
          : `${BASE_URL}/api/employee-evaluations/update/${formData.id}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to ${modalMode === "add" ? "create" : "update"} evaluation`
        );
      }

      toast.success(data.message || "Evaluation saved successfully!", {
        position: "top-right",
      });

      await fetchEvaluations(page, searchQuery);
      handleCloseDialog();
    } catch (error) {
      console.error(
        `Failed to ${modalMode === "add" ? "create" : "update"} evaluation:`,
        error
      );
      setApiError(
        error.message ||
          `Failed to ${
            modalMode === "add" ? "create" : "update"
          } evaluation. Please try again.`
      );
      setEvaluations(evaluations);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEvaluateDialog = (evalItem) => {
    setSelectedEvaluation(evalItem);
    setRatings({});
    setDescriptions({});
    setRemarks(evalItem.evaluation_remarks || "");
    setImprovements(evalItem.improvements_suggested || "");
    setApiError(null);
    setSubmitted(false);
    setEvaluateDialogOpen(true);

    const existingResponses = evaluationResponses[evalItem.id] || [];
    const initialRatings = {};
    const initialDescriptions = {};
    existingResponses.forEach((res) => {
      if (res.response_value !== null && res.response_value !== undefined) {
        initialRatings[res.parameter_mapping_id] = res.response_value;
      }
      if (res.description !== null && res.description !== undefined) {
        initialDescriptions[res.parameter_mapping_id] = res.description;
      }
    });
    setRatings(initialRatings);
    setDescriptions(initialDescriptions);
  };

  const handleCloseEvaluateDialog = () => {
    setEvaluateDialogOpen(false);
    setSelectedEvaluation(null);
    setRatings({});
    setDescriptions({});
    setRemarks("");
    setImprovements("");
    setApiError(null);
    setSubmitted(false);
  };

  const handleRatingChange = (parameterId, value) => {
    setRatings((prev) => ({
      ...prev,
      [parameterId]: Number(value),
    }));
  };

  const handleDescriptionChange = (parameterId, value) => {
    setDescriptions((prev) => ({
      ...prev,
      [parameterId]: value,
    }));
  };

  const handleEvaluateSubmit = async () => {
    setSubmitted(true);

    const parameter_responses =
      selectedEvaluation.template?.parameterMapping?.map((param) => {
        const type = param.parameter.type;
        return {
          parameter_mapping_id: param.id,
          response_value:
            type === "STAR_RATING" ? ratings[param.id] || null : null,
          description:
            type === "DESCRIPTIVE" ? descriptions[param.id] || null : null,
        };
      }) || [];

    const payload = {
      employee_evaluation_id: selectedEvaluation.id,
      parameter_responses,
      evaluation_remarks: remarks || null,
      improvements_suggested: improvements || null,
      created_by: null,
      updated_by: null,
    };

    try {
      setLoading(true);
      setApiError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-evaluation-responses/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit evaluation responses"
        );
      }

      setEvaluationResponses((prev) => ({
        ...prev,
        [selectedEvaluation.id]: payload.parameter_responses.map((res) => ({
          parameter_mapping_id: res.parameter_mapping_id,
          response_value: res.response_value,
        })),
      }));

      toast.success(data.message || "Evaluation submitted successfully!", {
        position: "top-right",
      });

      await fetchEvaluations(page, searchQuery);
      handleCloseEvaluateDialog();
    } catch (error) {
      console.error("Failed to submit evaluation:", error);
      setApiError(
        error.message || "Failed to submit evaluation. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeletePopover = (event, evaluationId) => {
    setDeletePopover({ anchorEl: event.currentTarget, evaluationId });
  };

  const handleCloseDeletePopover = () => {
    setDeletePopover({ anchorEl: null, evaluationId: null });
  };

  const handleDelete = async () => {
    if (!deletePopover.evaluationId) return;

    const tempEvaluations = evaluations.filter(
      (e) => e.id !== deletePopover.evaluationId
    );
    setEvaluations(tempEvaluations);

    setEvaluationResponses((prev) => {
      const updated = { ...prev };
      delete updated[deletePopover.evaluationId];
      return updated;
    });

    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);
      const response = await fetch(
        `${BASE_URL}/api/employee-evaluations/delete/${deletePopover.evaluationId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete evaluation");
      }

      toast.success(data.message || "Evaluation deleted successfully!", {
        position: "top-right",
      });

      await fetchEvaluations(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete evaluation:", error);
      setFetchError(
        error.message || "Failed to delete evaluation. Please try again."
      );
      setEvaluations(evaluations);
    } finally {
      setLoading(false);
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No evaluations found
    </Box>
  );

  const columns = [
    {
      field: "evaluatorEmployee",
      headerName: "Evaluator",
      width: 200,
      renderCell: (params) => {
        if (params.row.evaluatorEmployee?.name) {
          return <>{params.row.evaluatorEmployee.name}</>;
        }
        const name = params.row.evaluation_by_name;
        const email = params.row.evaluation_by_email;
        if (name && email) {
          return <>{`${name} (${email})`}</>;
        }
        return <>{name || email || "-"}</>;
      },
    },
    {
      field: "evaluation_for_employee_id",
      headerName: "Evaluated Employee",
      width: 150,
      renderCell: (params) => <>{params.row.evaluatedEmployee?.name || "-"}</>,
    },
    {
      field: "evaluator",
      headerName: "Evaluator Type",
      width: 150,
      renderCell: (params) => (
        <>{params.row.evaluation_by_employee_id ? "Employee" : "Guest"}</>
      ),
    },
    {
      field: "created_at",
      headerName: "Created At",
      width: 120,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "evaluate",
      headerName: "Evaluate",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEvaluateDialog(params.row)}
          aria-label="Evaluate"
        >
          <MdStar className="w-5 h-5 text-blue-500" />
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
          onClick={() => handleOpenDialog("edit", params.row)}
          aria-label="Edit evaluation"
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
          onClick={(event) => handleOpenDeletePopover(event, params.row.id)}
          aria-label="Delete evaluation"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Toaster position="top-right" reverseOrder={true} />
      {fetchError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {fetchError}
        </Typography>
      )}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 2 }}
      >
        <TextField
          variant="outlined"
          placeholder="Search Evaluations"
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            flex: 1,
            maxWidth: 300,
            "& .MuiOutlinedInput-root": {
              borderRadius: "20px",
              "& fieldset": {
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
              "&:hover fieldset": {
                borderColor: "rgba(0, 0, 0, 0.4)",
              },
              "&.Mui-focused fieldset": {
                borderColor: "rgb(42,196,171)",
              },
            },
            "& .MuiInputBase-input": {
              padding: "10px 14px",
            },
          }}
        />
        <Button
          variant="contained"
          sx={{
            backgroundColor: "rgb(42,196,171)",
            "&:hover": { backgroundColor: "rgb(35,170,148)" },
          }}
          onClick={() => handleOpenDialog("add")}
        >
          Add Evaluation
        </Button>
      </Box>
      <Paper sx={{ width: "100%", boxShadow: "none" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <BeatLoader color="rgb(42,196,171)" size={12} />
          </Box>
        ) : (
          <DataGrid
            rows={evaluations}
            columns={columns}
            autoHeight
            initialState={{
              pagination: { paginationModel: { page, pageSize: 100 } },
            }}
            pagination
            paginationMode="server"
            rowCount={total}
            onPaginationModelChange={(newModel) => setPage(newModel.page)}
            sx={{
              border: 0,
              boxShadow: "none",
              "& .MuiDataGrid-row.Mui-selected": {
                backgroundColor: "rgba(234, 248, 244, 1)",
                "&:hover": {
                  backgroundColor: "rgba(234, 248, 244, 1)",
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
        )}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        sx={{
          "& .MuiDialog-paper": {
            width: { xs: "90vw", sm: "500px" },
            maxHeight: "80vh",
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">
          {modalMode === "add" ? "Add Evaluation" : "Edit Evaluation"}
        </DialogTitle>
        <DialogContent className="overflow-y-auto">
          {apiError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {apiError}
            </Typography>
          )}
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Evaluator Type</FormLabel>
            <RadioGroup
              row
              value={evaluatorType}
              onChange={handleEvaluatorTypeChange}
            >
              <FormControlLabel
                value="employee"
                control={<Radio />}
                label="By Employee"
              />
              <FormControlLabel
                value="guest"
                control={<Radio />}
                label="By Guest"
              />
            </RadioGroup>
          </FormControl>
          <label style={{ marginBottom: 4, display: "block" }}>
            Evaluated Employee
          </label>
          <Box sx={{ mb: 2 }}>
            <Select
              options={employeeOptions}
              value={
                employeeOptions.find(
                  (opt) => opt.value === formData.evaluation_for_employee_id
                ) || null
              }
              onChange={(selected) =>
                handleInputChange(
                  "evaluation_for_employee_id",
                  selected ? selected.value : ""
                )
              }
              styles={customSelectStyles}
              placeholder="Select Employee..."
              isClearable
            />
            {submitted && formErrors.evaluation_for_employee_id && (
              <Typography color="error" sx={{ mt: 1, fontSize: "0.75rem" }}>
                {formErrors.evaluation_for_employee_id}
              </Typography>
            )}
          </Box>
          {evaluatorType === "employee" && (
            <>
              <label style={{ marginBottom: 4, display: "block" }}>
                Evaluator Employee
              </label>
              <Box sx={{ mb: 2 }}>
                <Select
                  options={employeeOptions}
                  value={
                    employeeOptions.find(
                      (opt) => opt.value === formData.evaluation_by_employee_id
                    ) || null
                  }
                  onChange={(selected) =>
                    handleInputChange(
                      "evaluation_by_employee_id",
                      selected ? selected.value : ""
                    )
                  }
                  styles={customSelectStyles}
                  placeholder="Select Employee..."
                  isClearable
                />
                {submitted && formErrors.evaluation_by_employee_id && (
                  <Typography color="error" sx={{ mt: 1, fontSize: "0.75rem" }}>
                    {formErrors.evaluation_by_employee_id}
                  </Typography>
                )}
              </Box>
            </>
          )}
          {evaluatorType === "guest" && (
            <>
              <label style={{ marginBottom: 4, display: "block" }}>
                Evaluator Name
              </label>
              <TextField
                fullWidth
                name="evaluation_by_name"
                value={formData.evaluation_by_name}
                onChange={(e) =>
                  handleInputChange(e.target.name, e.target.value)
                }
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "rgba(42,196,171, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(42,196,171)",
                    },
                  },
                  mb: 2,
                }}
              />
              <label style={{ marginBottom: 4, display: "block" }}>
                Evaluator Email
              </label>
              <TextField
                fullWidth
                name="evaluation_by_email"
                value={formData.evaluation_by_email}
                onChange={(e) =>
                  handleInputChange(e.target.name, e.target.value)
                }
                helperText={formErrors.email || ""}
                variant="outlined"
                FormHelperTextProps={{ style: { color: "red" } }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "rgba(42,196,171, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(42,196,171)",
                    },
                  },
                  mb: 0,
                }}
              />
            </>
          )}
          {submitted && formErrors.guestFields && (
            <Typography color="error" sx={{ mt: 1, fontSize: "0.75rem" }}>
              {formErrors.guestFields}
            </Typography>
          )}
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "justify-between", px: 3, pb: 3, pt: 2 }}
        >
          <Button
            onClick={handleCloseDialog}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: "rgb(42,196,171)",
              "&:hover": { backgroundColor: "rgb(35,170,148)" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            {loading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={evaluateDialogOpen}
        onClose={handleCloseEvaluateDialog}
        sx={{
          "& .MuiDialog-paper": {
            width: { xs: "90vw", sm: "500px" },
            maxHeight: "80vh",
            borderRadius: "8px",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">Evaluate</DialogTitle>
        <DialogContent className="overflow-y-auto">
          {apiError && (
            <Typography color="error" sx={{ mb: 2 }}>
              {apiError}
            </Typography>
          )}
          {selectedEvaluation && (
            <>
              <Typography sx={{ mb: 1 }}>
                <label>Template:</label>{" "}
                {selectedEvaluation.template?.name || "-"}
              </Typography>
              <Typography sx={{ mb: 3 }}>
                <label>Evaluated Employee:</label>{" "}
                {selectedEvaluation.evaluatedEmployee?.name || "-"}
              </Typography>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Rating
              </Typography>
              {selectedEvaluation.template?.parameterMapping?.length > 0 ? (
                selectedEvaluation.template.parameterMapping.map((param) => (
                  <Box key={param.id} sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 200, marginBottom: 0.5 }}>
                      {param.parameter.name}
                    </Typography>
                    {param.parameter.type === "STAR_RATING" ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => handleRatingChange(param.id, value)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                            }}
                            aria-label={`Rate ${value} stars for ${param.parameter.name}`}
                          >
                            {ratings[param.id] >= value ? (
                              <MdStar className="w-6 h-6 text-yellow-500" />
                            ) : (
                              <MdStarBorder className="w-6 h-6 text-gray-400" />
                            )}
                          </button>
                        ))}
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        value={descriptions[param.id] || ""}
                        onChange={(e) =>
                          handleDescriptionChange(param.id, e.target.value)
                        }
                        variant="outlined"
                        placeholder="Enter description"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: "rgba(42,196,171, 0.5)",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "rgb(42,196,171)",
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                ))
              ) : (
                <Typography color="textSecondary" sx={{ mb: 3 }}>
                  No parameters available for this template.
                </Typography>
              )}
              <label style={{ marginBottom: 4, display: "block" }}>
                General Remarks
              </label>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "rgba(42,196,171, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(42,196,171)",
                    },
                  },
                  mb: 2,
                }}
              />
              <label style={{ marginBottom: 4, display: "block" }}>
                Improvements Suggested
              </label>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&:hover fieldset": {
                      borderColor: "rgba(42,196,171, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "rgb(42,196,171)",
                    },
                  },
                  mb: 2,
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{ justifyContent: "justify-between", px: 3, pb: 3, pt: 2 }}
        >
          <Button
            onClick={handleCloseEvaluateDialog}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEvaluateSubmit}
            variant="contained"
            sx={{
              backgroundColor: "rgb(42,196,171)",
              "&:hover": { backgroundColor: "rgb(35,170,148)" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            {loading ? <BeatLoader color="#fff" size={8} /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(deletePopover.anchorEl)}
        anchorEl={deletePopover.anchorEl}
        onClose={handleCloseDeletePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2 }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete this evaluation?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              onClick={handleCloseDeletePopover}
              variant="outlined"
              sx={{
                borderColor: "#ef5350",
                color: "#ef5350",
                "&:hover": { borderColor: "#e53935", color: "#e53935" },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              variant="contained"
              color="error"
              disabled={loading}
            >
              {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default Staffs;
