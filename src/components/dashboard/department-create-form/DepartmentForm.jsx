"use client";

import React from "react";
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
  Box,
} from "@mui/material";
import Select from "react-select";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import Slide from "@mui/material/Slide";
import { BASE_URL } from "@/services/baseUrl";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
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

const validationSchema = yup.object().shape({
  name: yup.string().required("Department name is required").trim(),
  department_head_id: yup.number().nullable(),
  parent_id: yup.number().nullable(),
  description: yup.string().nullable().trim(),
});

const DepartmentFormPopup = ({ open, onClose, onSuccess, department }) => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
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
      department_head_id: null,
      parent_id: null,
      description: "",
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        department_head_id: null,
        parent_id: null,
        description: "",
      });
      setError(null);
      return;
    }

    if (department) {
      reset({
        name: department.name || "",
        department_head_id: department.department_head_id || null,
        parent_id: department.parent_id || null,
        description: department.description || "",
      });
    } else {
      reset({
        name: "",
        department_head_id: null,
        parent_id: null,
        description: "",
      });
    }
  }, [department, open, reset]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/list?limit=1000`);
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setEmployees(data.data?.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load employees for department head.");
      toast.error("Failed to load employees.", { position: "top-right" });
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/department/list?limit=1000`
      );
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();

      const filteredDepartments = department
        ? (data.data?.departments || []).filter(
            (dep) => dep.id !== department.id
          )
        : data.data?.departments || [];
      setDepartments(filteredDepartments);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments for parent selection.");
      toast.error("Failed to load departments.", { position: "top-right" });
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchDepartments();
    }
  }, [open]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        department_head_id: formData.department_head_id
          ? Number(formData.department_head_id)
          : null,
        parent_id: formData.parent_id ? Number(formData.parent_id) : null,
        description: formData.description ? formData.description.trim() : null,
      };

      const method = department ? "PUT" : "POST";
      const url = department
        ? `${BASE_URL}/api/department/update/${department.id}`
        : `${BASE_URL}/api/department/create`;

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
            `Failed to ${department ? "update" : "create"} department`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Department ${department ? "updated" : "created"} successfully!`,
        { position: "top-right" }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${department ? "updating" : "creating"} department:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            department ? "update" : "create"
          } department. Please try again.`
      );
      toast.error(
        err.message ||
          `Failed to ${department ? "update" : "create"} department.`,
        { position: "top-right" }
      );
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  const departmentOptions = departments.map((dep) => ({
    value: dep.id,
    label: dep.name,
  }));

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
        {department ? "Edit Department" : "Add Department"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Box display="flex" flexDirection="column" gap={2} mb={2}>
          <Box>
            <label className="block mb-1">Department Name *</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  className="bg-white"
                  InputProps={{ className: "h-10" }}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Department Head</label>
            <Controller
              name="department_head_id"
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
                    placeholder="Select Department Head..."
                    isClearable
                  />
                  {errors.department_head_id && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.department_head_id?.message}
                    </span>
                  )}
                </div>
              )}
            />
          </Box>
          <Box>
            <label className="block mb-1">Parent Department</label>
            <Controller
              name="parent_id"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    options={departmentOptions}
                    value={
                      departmentOptions.find(
                        (opt) => opt.value === field.value
                      ) || null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    styles={customSelectStyles}
                    placeholder="Select Parent Department..."
                    isClearable
                  />
                  {errors.parent_id && (
                    <span className="text-red-600 text-xs mt-1 block">
                      {errors.parent_id?.message}
                    </span>
                  )}
                </div>
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
                  className="bg-white"
                  error={!!errors.description}
                  helperText={errors.description?.message}
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
          ) : department ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentFormPopup;
