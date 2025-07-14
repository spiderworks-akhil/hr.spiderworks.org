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
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import Select from "react-select";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL, BASE_AUTH_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

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
  employee_code: yup.string().nullable().trim(),
  personal_email: yup.string().nullable().email("Invalid email address").trim(),
  work_email: yup
    .string()
    .required("Work email is required")
    .email("Invalid email address")
    .trim(),
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
    .required("Office phone is required")
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
  employee_type: yup
    .number()
    .oneOf(
      [0, 1],
      "Employee type must be either Current Employee (1) or Ex-Employee (0)"
    )
    .required("Employee type is required"),
  departments_id: yup.number().nullable(),
  employee_roles_id: yup.number().nullable(),
  manager_id: yup.number().nullable(),
  additional_manager_ids: yup.array().of(yup.number()).nullable(),
  designation: yup.string().nullable().trim(),
});

const EmployeeFormPopup = ({ open, onClose, onSuccess, employee }) => {
  const { data: session } = useSession();
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultValues = {
    name: "",
    employee_code: "",
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
    employee_type: 1,
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
    designation: "",
    confirmation_date: null,
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(validationSchema),
    mode: "onChange",
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
        employee_code: employee.employee_code || "",
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
        employee_type:
          employee.employee_type !== null &&
          employee.employee_type !== undefined
            ? employee.employee_type
            : 1,
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
        designation:
          employee.designation && employee.designation.trim() !== "-"
            ? employee.designation
            : "",
        confirmation_date: employee.confirmation_date
          ? moment(employee.confirmation_date)
          : null,
      });
    } else {
      reset(defaultValues);
    }
  }, [employee, open, reset]);

  const fetchManagers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/employees/list?limit=1000`);
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
      const response = await fetch(
        `${BASE_URL}/api/department/list?limit=1000`
      );
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
      const response = await fetch(`${BASE_URL}/api/role/list?limit=1000`);
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
      const response = await fetch(
        `${BASE_URL}/api/employee-level/list?limit=1000`
      );
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

      if (!session?.user?.id) {
        toast.error("User session not found. Please sign in again.", {
          position: "top-right",
        });
        setLoading(false);
        return;
      }

      let userId = null;

      if (!employee) {
        const authUserData = {
          name: formData.name.trim(),
          email: formData.work_email || null,
          phone: formData.office_phone || null,
          type: "HR",
          password: "123@Spiderworks",
        };

        const authResponse = await fetch(
          `${BASE_AUTH_URL}/api/user-auth/register`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(authUserData),
            credentials: "include",
          }
        );

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          throw new Error(
            errorData.message || "Failed to create user in auth service"
          );
        }

        const authUser = await authResponse.json();
        if (!authUser.data?.data?.id) {
          throw new Error("Auth user creation did not return an ID");
        }
        userId = Number(authUser.data?.data?.id);

        const fetchAllResponse = await fetch(
          `${BASE_AUTH_URL}/api/user-auth/fetch-all`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!fetchAllResponse.ok) {
          throw new Error("Failed to fetch users from auth service");
        }

        const authUsers = await fetchAllResponse.json();

        const transformedUsers = (authUsers.data || authUsers).map((user) => {
          let first_name = null;
          let last_name = null;
          if (user.name) {
            const nameParts = user.name.trim().split(" ");
            first_name = nameParts[0] || null;
            last_name =
              nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;
          }

          return {
            id: parseInt(user.id, 10),
            first_name,
            last_name,
            email: user.email || null,
            phone: user.phone || null,
          };
        });

        const syncResponse = await fetch(`${BASE_URL}/api/users/syncing`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ users: transformedUsers }),
        });

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json();
          throw new Error(errorData.message || "Failed to sync users");
        }

        const syncData = await syncResponse.json();
        toast.success(syncData.message || "Users synced successfully!", {
          position: "top-right",
        });
      }

      const payload = {
        name: formData.name.trim(),
        employee_code: formData.employee_code.trim(),
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
        employee_type: Number(formData.employee_type),
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
        designation:
          formData.designation && formData.designation.trim() !== "-"
            ? formData.designation
            : null,
        confirmation_date: formatDateSimple(formData.confirmation_date),
        ...(employee ? {} : { user_id: userId }),
        ...(employee
          ? { updated_by: Number(session.user.id) }
          : {
              created_by: Number(session.user.id),
              updated_by: Number(session.user.id),
            }),
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
    { value: 1, label: "Current Employee" },
    { value: 0, label: "Ex-Employee" },
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
            width: { xs: "100%", sm: "100%" },
            maxWidth: "100%",
            height: "100%",
            borderRadius: 0,
            maxHeight: "100%",
          },
        }}
      >
        <DialogTitle className="text-lg font-semibold">
          {employee ? "Edit Employee" : "Create Employee"}
        </DialogTitle>
        <DialogContent>
          {error && <div className="text-red-600 mb-4">{error}</div>}
          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Typography variant="h6" className="font-semibold">
              Personal Details
            </Typography>
            <Box
              display="flex"
              flexWrap="wrap"
              gap={2}
              sx={{
                "& > .field-box": {
                  flex: { xs: "1 1 100%", md: "1 1 calc(33.33% - 16px)" },
                  minWidth: { md: "0" },
                },
                "& > .full-width-box": {
                  flex: "1 1 100%",
                  minWidth: 0,
                },
              }}
            >
              <Box className="field-box">
                <label className="block mb-1">Name *</label>
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
              <Box className="field-box">
                <label className="block mb-1">Employee Code</label>
                <Controller
                  name="employee_code"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.employee_code}
                      helperText={errors.employee_code?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Personal Email</label>
                <Controller
                  name="personal_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.personal_email}
                      helperText={errors.personal_email?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Work Email *</label>
                <Controller
                  name="work_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.work_email}
                      helperText={errors.work_email?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Personal Phone</label>
                <Controller
                  name="personal_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.personal_phone}
                      helperText={errors.personal_phone?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Office Phone *</label>
                <Controller
                  name="office_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.office_phone}
                      helperText={errors.office_phone?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Official Date of Birth</label>
                <Controller
                  name="official_date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.official_date_of_birth,
                          helperText: errors.official_date_of_birth?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Celebrated Date</label>
                <Controller
                  name="celebrated_date_of_birth"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.celebrated_date_of_birth,
                          helperText: errors.celebrated_date_of_birth?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Marriage Date</label>
                <Controller
                  name="marriage_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.marriage_date,
                          helperText: errors.marriage_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Facebook URL</label>
                <Controller
                  name="facebook_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.facebook_url}
                      helperText={errors.facebook_url?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Instagram URL</label>
                <Controller
                  name="instagram_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.instagram_url}
                      helperText={errors.instagram_url?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">LinkedIn URL</label>
                <Controller
                  name="linkedin_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.linkedin_url}
                      helperText={errors.linkedin_url?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Blog URL</label>
                <Controller
                  name="blog_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.blog_url}
                      helperText={errors.blog_url?.message}
                    />
                  )}
                />
              </Box>
              <Box className="full-width-box">
                <label className="block mb-1">Address</label>
                <Controller
                  name="address"
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
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Box>
            </Box>

            <Typography variant="h6" className="font-semibold" sx={{ mt: 2 }}>
              Employment Details
            </Typography>
            <Box
              display="flex"
              flexWrap="wrap"
              gap={2}
              sx={{
                "& > .field-box": {
                  flex: { xs: "1 1 100%", md: "1 1 calc(33.33% - 16px)" },
                  minWidth: { md: "0" },
                },
                "& > .full-width-box": {
                  flex: "1 1 100%",
                  minWidth: 0,
                },
              }}
            >
              <Box className="field-box">
                <label className="block mb-1">Joining Date</label>
                <Controller
                  name="joining_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.joining_date,
                          helperText: errors.joining_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Releaving Date</label>
                <Controller
                  name="releaving_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.releaving_date,
                          helperText: errors.releaving_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Designation</label>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.designation}
                      helperText={errors.designation?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Confirmation Date</label>
                <Controller
                  name="confirmation_date"
                  control={control}
                  render={({ field }) => (
                    <DesktopDatePicker
                      inputFormat="DD-MM-YYYY"
                      value={field.value}
                      onChange={field.onChange}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.confirmation_date,
                          helperText: errors.confirmation_date?.message,
                          className: "bg-white",
                          InputProps: { className: "h-10" },
                        },
                      }}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Employee Level</label>
                <Controller
                  name="employee_level_id"
                  control={control}
                  render={({ field }) => (
                    <div>
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
                      {errors.employee_level_id && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.employee_level_id?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Employee Type</label>
                <Controller
                  name="employee_type"
                  control={control}
                  render={({ field }) => (
                    <div>
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
                      />
                      {errors.employee_type && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.employee_type?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Department</label>
                <Controller
                  name="departments_id"
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
                        placeholder="Select Department..."
                        isClearable
                      />
                      {errors.departments_id && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.departments_id?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Role</label>
                <Controller
                  name="employee_roles_id"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={roleOptions}
                        value={
                          roleOptions.find(
                            (opt) => opt.value === field.value
                          ) || null
                        }
                        onChange={(selected) =>
                          field.onChange(selected ? selected.value : null)
                        }
                        styles={customSelectStyles}
                        placeholder="Select Role..."
                        isClearable
                      />
                      {errors.employee_roles_id && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.employee_roles_id?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Manager</label>
                <Controller
                  name="manager_id"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Select
                        options={managerOptions}
                        value={
                          managerOptions.find(
                            (opt) => opt.value === field.value
                          ) || null
                        }
                        onChange={(selected) =>
                          field.onChange(selected ? selected.value : null)
                        }
                        styles={customSelectStyles}
                        placeholder="Select Manager..."
                        isClearable
                      />
                      {errors.manager_id && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.manager_id?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Additional Managers</label>
                <Controller
                  name="additional_manager_ids"
                  control={control}
                  render={({ field }) => (
                    <div>
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
                      {errors.additional_manager_ids && (
                        <span className="text-red-600 text-xs mt-1 block">
                          {errors.additional_manager_ids?.message}
                        </span>
                      )}
                    </div>
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Reporting Emails</label>
                <Controller
                  name="reporting_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.reporting_email}
                      helperText={errors.reporting_email?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Last Sign In Emails</label>
                <Controller
                  name="last_sign_in_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.last_sign_in_email}
                      helperText={errors.last_sign_in_email?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Last Sign Out Emails</label>
                <Controller
                  name="last_sign_out_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.last_sign_out_email}
                      helperText={errors.last_sign_out_email?.message}
                    />
                  )}
                />
              </Box>
              <Box className="field-box">
                <label className="block mb-1">Leave Notification Emails</label>
                <Controller
                  name="leave_notification_mails"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      variant="outlined"
                      size="small"
                      className="bg-white"
                      InputProps={{ className: "h-10" }}
                      error={!!errors.leave_notification_mails}
                      helperText={errors.leave_notification_mails?.message}
                    />
                  )}
                />
              </Box>
              <Box className="full-width-box">
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
                      className="bg-white"
                      error={!!errors.remarks}
                      helperText={errors.remarks?.message}
                    />
                  )}
                />
              </Box>
              <Box className="full-width-box">
                <Controller
                  name="is_signin_mandatory"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={field.value} />}
                      label="Sign In is mandatory for this employee."
                      className="text-sm"
                    />
                  )}
                />
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
