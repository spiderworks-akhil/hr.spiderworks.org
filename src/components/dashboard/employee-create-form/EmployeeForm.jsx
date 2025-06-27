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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import Select from "react-select";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

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

const validationSchema = yup.object().shape({
  name: yup.string().required("Name is required").trim(),
  personal_email: yup.string().nullable().email("Invalid email address").trim(),
  work_email: yup.string().nullable().email("Invalid email address").trim(),
  personal_phone: yup
    .string()
    .nullable()
    .matches(/^\+?[1-9]\d{1,14}$/, {
      message: "Invalid phone number (e.g., +1234567890)",
      excludeEmptyString: true,
    })
    .trim(),
  office_phone: yup
    .string()
    .nullable()
    .matches(/^\+?[1-9]\d{1,14}$/, {
      message: "Invalid phone number (e.g., +1234567890)",
      excludeEmptyString: true,
    })
    .trim(),
  reporting_email: yup
    .string()
    .nullable()
    .email("Invalid email address")
    .trim(),
  last_sign_in_email: yup
    .string()
    .nullable()
    .email("Invalid email address")
    .trim(),
  last_sign_out_email: yup
    .string()
    .nullable()
    .email("Invalid email address")
    .trim(),
  leave_notification_mails: yup
    .string()
    .nullable()
    .email("Invalid email address")
    .trim(),
  facebook_url: yup.string().nullable().url("Invalid URL").trim(),
  instagram_url: yup.string().nullable().url("Invalid URL").trim(),
  linkedin_url: yup.string().nullable().url("Invalid URL").trim(),
  blog_url: yup.string().nullable().url("Invalid URL").trim(),
  address: yup.string().nullable().trim(),
  remarks: yup.string().nullable().trim(),
  employee_level_id: yup.number().nullable(),
  employee_type: yup.string().nullable().trim(),
  departments_id: yup.number().nullable(),
  employee_roles_id: yup.number().nullable(),
  manager_id: yup.number().nullable(),
  additional_manager_ids: yup.array().of(yup.number()).nullable(),
});

const EmployeeFormPopup = ({ open, onClose, onSuccess, employee }) => {
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultValues = {
    name: "",
    personal_email: "",
    work_email: "",
    personal_phone: "",
    office_phone: "",
    official_date_of_birth: null,
    celebrated_date_of_birth: null,
    marriage_date: null,
    joining_date: null,
    releaving_date: null,
    employee_level_id: null,
    employee_type: "",
    departments_id: null,
    employee_roles_id: null,
    manager_id: null,
    additional_manager_ids: [],
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    blog_url: "",
    address: "",
    remarks: "",
    reporting_email: "",
    last_sign_in_email: "",
    last_sign_out_email: "",
    leave_notification_mails: "",
    is_signin_mandatory: true,
    has_work_portal_access: 0,
    has_hr_portal_access: 0,
    has_client_portal_access: 0,
    has_inventory_portal_access: 0,
    has_super_admin_access: 0,
    has_accounts_portal_access: 0,
    has_admin_portal_access: 0,
    has_showcase_portal_access: 0,
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (!open) {
      reset(defaultValues);
      setError(null);
      return;
    }

    if (employee) {
      reset({
        name: employee.name || "",
        personal_email: employee.personal_email || "",
        work_email: employee.work_email || "",
        personal_phone: employee.personal_phone || "",
        office_phone: employee.office_phone || "",
        official_date_of_birth: employee.official_date_of_birth
          ? moment(employee.official_date_of_birth)
          : null,
        celebrated_date_of_birth: employee.celebrated_date_of_birth
          ? moment(employee.celebrated_date_of_birth)
          : null,
        marriage_date: employee.marriage_date
          ? moment(employee.marriage_date)
          : null,
        joining_date: employee.joining_date
          ? moment(employee.joining_date)
          : null,
        releaving_date: employee.releaving_date
          ? moment(employee.releaving_date)
          : null,
        employee_level_id: employee.employeeLevel?.id || null,
        employee_type: employee.employee_type || "",
        departments_id: employee.departments_id || null,
        employee_roles_id: employee.employee_roles_id || null,
        manager_id: employee.manager_id || null,
        additional_manager_ids: employee.additionalManagers
          ? employee.additionalManagers.map((m) => m.id)
          : [],
        facebook_url: employee.facebook_url || "",
        instagram_url: employee.instagram_url || "",
        linkedin_url: employee.linkedin_url || "",
        blog_url: employee.blog_url || "",
        address: employee.address || "",
        remarks: employee.remarks || "",
        reporting_email: employee.reporting_email || "",
        last_sign_in_email: employee.last_sign_in_email || "",
        last_sign_out_email: employee.last_sign_out_email || "",
        leave_notification_mails: employee.leave_notification_mails || "",
        is_signin_mandatory: employee.is_signin_mandatory !== false,
        has_work_portal_access: employee.has_work_portal_access || 0,
        has_hr_portal_access: employee.has_hr_portal_access || 0,
        has_client_portal_access: employee.has_client_portal_access || 0,
        has_inventory_portal_access: employee.has_inventory_portal_access || 0,
        has_super_admin_access: employee.has_super_admin_access || 0,
        has_accounts_portal_access: employee.has_accounts_portal_access || 0,
        has_admin_portal_access: employee.has_admin_portal_access || 0,
        has_showcase_portal_access: employee.has_showcase_portal_access || 0,
      });
    } else {
      reset(defaultValues);
    }
  }, [employee, open, reset]);

  const fetchManagers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/list`);
      if (!response.ok) throw new Error("Failed to fetch managers");
      const data = await response.json();
      setManagers(data.data?.employees || []);
    } catch (err) {
      console.error("Error fetching managers:", err);
      setError("Failed to load managers.");
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/department/list`);
      if (!response.ok) throw new Error("Failed to fetch departments");
      const data = await response.json();
      setDepartments(data.data?.departments || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
      setError("Failed to load departments.");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/role/list`);
      if (!response.ok) throw new Error("Failed to fetch roles");
      const data = await response.json();
      setRoles(data.data?.roles || []);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError("Failed to load roles.");
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employee-level/list`);
      if (!response.ok) throw new Error("Failed to fetch employee levels");
      const data = await response.json();
      setLevels(data.data?.employeeLevels || []);
    } catch (err) {
      console.error("Error fetching employee levels:", err);
      setError("Failed to load employee levels.");
    }
  };

  useEffect(() => {
    if (open) {
      fetchManagers();
      fetchDepartments();
      fetchRoles();
      fetchLevels();
    }
  }, [open]);

  const formatDateSimple = (momentDate) => {
    return momentDate && moment.isMoment(momentDate)
      ? momentDate.format("YYYY-MM-DD")
      : null;
  };

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        personal_email: formData.personal_email || null,
        work_email: formData.work_email || null,
        personal_phone: formData.personal_phone || null,
        office_phone: formData.office_phone || null,
        official_date_of_birth: formatDateSimple(
          formData.official_date_of_birth
        ),
        celebrated_date_of_birth: formatDateSimple(
          formData.celebrated_date_of_birth
        ),
        marriage_date: formatDateSimple(formData.marriage_date),
        joining_date: formatDateSimple(formData.joining_date),
        releaving_date: formatDateSimple(formData.releaving_date),
        employee_level_id: formData.employee_level_id
          ? Number(formData.employee_level_id)
          : null,
        employee_type: formData.employee_type || null,
        departments_id: formData.departments_id
          ? Number(formData.departments_id)
          : null,
        employee_roles_id: formData.employee_roles_id
          ? Number(formData.employee_roles_id)
          : null,
        manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        additional_manager_ids: formData.additional_manager_ids
          ? formData.additional_manager_ids.map(Number)
          : [],
        facebook_url: formData.facebook_url || null,
        instagram_url: formData.instagram_url || null,
        linkedin_url: formData.linkedin_url || null,
        blog_url: formData.blog_url || null,
        address: formData.address || null,
        remarks: formData.remarks || null,
        reporting_email: formData.reporting_email || null,
        last_sign_in_email: formData.last_sign_in_email || null,
        last_sign_out_email: formData.last_sign_out_email || null,
        leave_notification_mails: formData.leave_notification_mails || null,
        is_signin_mandatory: formData.is_signin_mandatory ? 1 : 0,
        has_work_portal_access: formData.has_work_portal_access ? 1 : 0,
        has_hr_portal_access: formData.has_hr_portal_access ? 1 : 0,
        has_client_portal_access: formData.has_client_portal_access ? 1 : 0,
        has_inventory_portal_access: formData.has_inventory_portal_access
          ? 1
          : 0,
        has_super_admin_access: formData.has_super_admin_access ? 1 : 0,
        has_accounts_portal_access: formData.has_accounts_portal_access ? 1 : 0,
        has_admin_portal_access: formData.has_admin_portal_access ? 1 : 0,
        has_showcase_portal_access: formData.has_showcase_portal_access ? 1 : 0,
      };

      const url = employee
        ? `${BASE_URL}/api/employees/update/${employee.id}`
        : `${BASE_URL}/api/employees/create`;
      const method = employee ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${employee ? "update" : "create"} employee`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Employee ${employee ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );
      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${employee ? "updating" : "creating"} employee:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            employee ? "update" : "create"
          } employee. Please try again.`
      );
      toast.error(
        err.message || `Failed to ${employee ? "update" : "create"} employee.`,
        {
          position: "top-right",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const employeeLevelOptions = levels.map((level) => ({
    value: level.id,
    label: level.name,
  }));

  const employeeTypeOptions = [
    { value: "Consultant", label: "Consultant" },
    { value: "Employee", label: "Employee" },
    { value: "Ex-Employee", label: "Ex-Employee" },
  ];

  const departmentOptions = departments.map((dept) => ({
    value: dept.id,
    label: dept.name,
  }));

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const managerOptions = managers.map((manager) => ({
    value: manager.id,
    label: manager.name,
  }));

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
        <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Name
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Employee ID
              </label>
              <TextField
                fullWidth
                disabled
                value={employee?.id || ""}
                variant="outlined"
                size="small"
                InputProps={{ style: { height: "40px" } }}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Personal Email
              </label>
              <Controller
                name="personal_email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.personal_email}
                    helperText={errors.personal_email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Work Email
              </label>
              <Controller
                name="work_email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.work_email}
                    helperText={errors.work_email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Personal Phone
              </label>
              <Controller
                name="personal_phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.personal_phone}
                    helperText={errors.personal_phone?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Office Phone
              </label>
              <Controller
                name="office_phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.office_phone}
                    helperText={errors.office_phone?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Official Date of Birth
              </label>
              <Controller
                name="official_date_of_birth"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={field.onChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          style: { height: "40px" },
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Celebrated Date
              </label>
              <Controller
                name="celebrated_date_of_birth"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={field.onChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          style: { height: "40px" },
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Marriage Date
              </label>
              <Controller
                name="marriage_date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={field.onChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          style: { height: "40px" },
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Joining Date
              </label>
              <Controller
                name="joining_date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={field.onChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          style: { height: "40px" },
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Releaving Date
              </label>
              <Controller
                name="releaving_date"
                control={control}
                render={({ field }) => (
                  <DesktopDatePicker
                    inputFormat="DD-MM-YYYY"
                    value={field.value}
                    onChange={field.onChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          style: { height: "40px" },
                        }}
                      />
                    )}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Employee Level
              </label>
              <Controller
                name="employee_level_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={employeeLevelOptions}
                    value={
                      employeeLevelOptions.find(
                        (opt) => opt.value === field.value
                      ) || null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    styles={customSelectStyles}
                    placeholder="Select Employee Level..."
                    isClearable
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Employee Type
              </label>
              <Controller
                name="employee_type"
                control={control}
                render={({ field }) => (
                  <Select
                    options={employeeTypeOptions}
                    value={
                      employeeTypeOptions.find(
                        (opt) => opt.value === field.value
                      ) || null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    styles={customSelectStyles}
                    placeholder="Select Employee Type..."
                    isClearable
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Department
              </label>
              <Controller
                name="departments_id"
                control={control}
                render={({ field }) => (
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
                    placeholder="Select Department..."
                    isClearable
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Role
              </label>
              <Controller
                name="employee_roles_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={roleOptions}
                    value={
                      roleOptions.find((opt) => opt.value === field.value) ||
                      null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    styles={customSelectStyles}
                    placeholder="Select Role..."
                    isClearable
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Manager
              </label>
              <Controller
                name="manager_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={managerOptions}
                    value={
                      managerOptions.find((opt) => opt.value === field.value) ||
                      null
                    }
                    onChange={(selected) =>
                      field.onChange(selected ? selected.value : null)
                    }
                    styles={customSelectStyles}
                    placeholder="Select Manager..."
                    isClearable
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Additional Managers
              </label>
              <Controller
                name="additional_manager_ids"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    options={managerOptions}
                    value={managerOptions.filter((opt) =>
                      field.value.includes(opt.value)
                    )}
                    onChange={(selected) =>
                      field.onChange(
                        selected ? selected.map((opt) => opt.value) : []
                      )
                    }
                    styles={customSelectStyles}
                    placeholder="Select Additional Managers..."
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Facebook URL
              </label>
              <Controller
                name="facebook_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.facebook_url}
                    helperText={errors.facebook_url?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Instagram URL
              </label>
              <Controller
                name="instagram_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.instagram_url}
                    helperText={errors.instagram_url?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                LinkedIn URL
              </label>
              <Controller
                name="linkedin_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.linkedin_url}
                    helperText={errors.linkedin_url?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Blog URL
              </label>
              <Controller
                name="blog_url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.blog_url}
                    helperText={errors.blog_url?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Address
              </label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Remarks
              </label>
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
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Reporting Email
              </label>
              <Controller
                name="reporting_email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.reporting_email}
                    helperText={errors.reporting_email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Last Sign In Emails
              </label>
              <Controller
                name="last_sign_in_email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.last_sign_in_email}
                    helperText={errors.last_sign_in_email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Last Sign Out Emails
              </label>
              <Controller
                name="last_sign_out_email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.last_sign_out_email}
                    helperText={errors.last_sign_out_email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={6}>
              <label style={{ display: "block", marginBottom: "4px" }}>
                Leave Notification Mails
              </label>
              <Controller
                name="leave_notification_mails"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    variant="outlined"
                    size="small"
                    InputProps={{ style: { height: "40px" } }}
                    error={!!errors.leave_notification_mails}
                    helperText={errors.leave_notification_mails?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="is_signin_mandatory"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Checkbox {...field} checked={field.value} />}
                    label="Sign In is mandatory for this employee."
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
            ) : employee ? (
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

export default EmployeeFormPopup;
