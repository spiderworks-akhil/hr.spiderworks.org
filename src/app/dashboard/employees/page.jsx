"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  MdOutlineSecurity,
  MdEdit,
  MdDelete,
  MdPersonAdd,
} from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Popover,
  Typography,
  Box,
  Paper,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import moment from "moment";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import EmployeeFormPopup from "@/components/dashboard/employee-create-form/EmployeeForm";
import { BASE_URL, BASE_AUTH_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";
import { FaFileImport } from "react-icons/fa";

const Select = dynamic(() => import("react-select"), { ssr: false });

const Employees = () => {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [keyword, setKeyword] = useState("");
  const [employeeType, setEmployeeType] = useState({
    value: 1,
    label: "Current Employee",
  });
  const [employeeRole, setEmployeeRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [employeeLevel, setEmployeeLevel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForEmployeeForm, setUserForEmployeeForm] = useState(null);

  const [permissionAnchorEl, setPermissionAnchorEl] = useState(null);
  const [employeeToEditPermissions, setEmployeeToEditPermissions] =
    useState(null);
  const [permissions, setPermissions] = useState({
    has_work_portal_access: false,
    has_hr_portal_access: false,
    has_client_portal_access: false,
    has_inventory_portal_access: false,
    has_super_admin_access: false,
    has_accounts_portal_access: false,
    has_admin_portal_access: false,
    has_showcase_portal_access: false,
  });

  const [employeeTypeOptions, setEmployeeTypeOptions] = useState([]);
  const [employeeRoleOptions, setEmployeeRoleOptions] = useState([]);
  const [allRoleOptions, setAllRoleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [allDepartmentOptions, setAllDepartmentOptions] = useState([]);
  const [employeeLevelOptions, setEmployeeLevelOptions] = useState([]);
  const [importNotesOpen, setImportNotesOpen] = useState(false);
  const [importedFiles, setImportedFiles] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [allAuthUsers, setAllAuthUsers] = useState([]);

  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <Link
          href={`/dashboard/employees/${params.row.id}`}
          style={{ textDecoration: "underline" }}
        >
          {params.value}
        </Link>
      ),
    },
    { field: "role_name", headerName: "Role", width: 150 },
    { field: "employee_level_name", headerName: "Level", width: 150 },
    { field: "department_name", headerName: "Department", width: 150 },
    { field: "manager_name", headerName: "Manager", width: 150 },
    {
      field: "joining_date",
      headerName: "Joining Date",
      width: 120,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "designation",
      headerName: "Designation",
      width: 150,
      renderCell: (params) => <>{params.value || "-"}</>,
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit employee"
        >
          <MdEdit className="w-5 h-5 text-gray-500" />
        </button>
      ),
    },
    {
      field: "permissions",
      headerName: "Permissions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={(event) => handleOpenPermissionsPopover(event, params.row)}
          aria-label="Edit permissions"
        >
          <MdOutlineSecurity className="w-5 h-5 text-gray-500" />
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
          aria-label="Delete employee"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditEmployee(null);
    setOpenDialog(true);
  };

  const handleOpenCreateModal = async () => {
    setOpenCreateModal(true);
    await fetchAvailableUsers();
  };

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false);
    setSelectedUser(null);
    setAvailableUsers([]);
  };

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);

      const authResponse = await fetch(
        `${BASE_AUTH_URL}/api/user-auth/fetch-all`
      );
      if (!authResponse.ok) {
        throw new Error("Failed to fetch users from auth service");
      }
      const authUsers = await authResponse.json();

      const employeesRes = await fetch(
        `${BASE_URL}/api/employees/list?limit=1000`
      );
      let allEmployees = [];
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        allEmployees = (employeesData.data?.employees || [])
          .map((emp) => parseInt(emp.user_id, 10))
          .filter((id) => !isNaN(id));
      }

      const existingEmployeeUserIds = allEmployees;

      const availableUsers = (authUsers.data || authUsers).filter(
        (user) => !existingEmployeeUserIds.includes(parseInt(user.id, 10))
      );

      setAvailableUsers(availableUsers);
    } catch (error) {
      console.error("Failed to fetch available users:", error);
      toast.error("Failed to load available users.", { position: "top-right" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleCreateEmployeeFromUser = async () => {
    if (!selectedUser) {
      toast.error("Please select a user first.", { position: "top-right" });
      return;
    }
    setOpenCreateModal(false);
    setUserForEmployeeForm(selectedUser);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (employee) => {
    setEditEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditEmployee(null);
    setUserForEmployeeForm(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditEmployee(null);
    fetchEmployees(
      page,
      keyword,
      employeeType,
      employeeRole,
      department,
      employeeLevel
    );
  };

  const handleOpenDeletePopover = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setEmployeeToDelete(employee);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setEmployeeToDelete(null);
  };

  const handleOpenPermissionsPopover = (event, employee) => {
    setPermissionAnchorEl(event.currentTarget);
    setEmployeeToEditPermissions(employee);
    setPermissions(getEmployeePermissions(employee));
  };

  const handleClosePermissionsPopover = () => {
    setPermissionAnchorEl(null);
    setEmployeeToEditPermissions(null);
    setPermissions({
      has_work_portal_access: false,
      has_hr_portal_access: false,
      has_client_portal_access: false,
      has_inventory_portal_access: false,
      has_super_admin_access: false,
      has_accounts_portal_access: false,
      has_admin_portal_access: false,
      has_showcase_portal_access: false,
    });
  };

  const handlePermissionChange = (event) => {
    setPermissions({
      ...permissions,
      [event.target.name]: event.target.checked,
    });
  };

  const mapPermissionsToAuthDto = (permissions) => ({
    accounts: permissions.has_accounts_portal_access,
    works: permissions.has_work_portal_access,
    hr: permissions.has_hr_portal_access,
    client: permissions.has_client_portal_access,
    inventory: permissions.has_inventory_portal_access,
    super_admin: permissions.has_super_admin_access,
    admin: permissions.has_admin_portal_access,
    showcase: permissions.has_showcase_portal_access,
    type: "HR",
  });

  const getEmployeePermissions = (employee) => {
    const authUser = allAuthUsers.find(
      (u) => String(u.id) === String(employee.user_id)
    );
    const p = authUser?.permissions || {};
    return {
      has_work_portal_access: !!p.work,
      has_hr_portal_access: !!p.hr,
      has_client_portal_access: !!p.client,
      has_inventory_portal_access: !!p.inventory,
      has_super_admin_access: !!p.super_admin,
      has_accounts_portal_access: !!p.account,
      has_admin_portal_access: !!p.admin,
      has_showcase_portal_access: !!p.showcase,
    };
  };

  const handleUpdatePermissions = async () => {
    if (!employeeToEditPermissions) return;
    const sessionUserId = parseInt(session?.user?.id, 10);
    const employeeUserId = parseInt(employeeToEditPermissions?.user_id, 10);
    if (sessionUserId && employeeUserId && sessionUserId === employeeUserId) {
      toast.error("You cannot change your own permissions.", {
        position: "top-right",
      });
      handleClosePermissionsPopover();
      return;
    }
    handleClosePermissionsPopover();
    try {
      setLoading(true);
      setFetchError(null);
      if (!session?.user?.id) {
        toast.error("User session not found. Please sign in again.", {
          position: "top-right",
        });
        setLoading(false);
        return;
      }

      const authPayload = {
        accounts: !!permissions.has_accounts_portal_access,
        works: !!permissions.has_work_portal_access,
        hr: !!permissions.has_hr_portal_access,
        client: !!permissions.has_client_portal_access,
        inventory: !!permissions.has_inventory_portal_access,
        super_admin: !!permissions.has_super_admin_access,
        admin: !!permissions.has_admin_portal_access,
        showcase: !!permissions.has_showcase_portal_access,
        type: "HR",
      };
      const userId = employeeToEditPermissions.user_id;
      const adminId = session.user.id;

      const authRes = await fetch(
        `${BASE_AUTH_URL}/api/user-auth/permission/${userId}/${adminId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authPayload),
        }
      );
      if (!authRes.ok) {
        const errorData = await authRes.json();
        throw new Error(
          errorData.message || "Failed to update user auth permissions"
        );
      }

      const response = await fetch(
        `${BASE_URL}/api/employees/permissions/update?id=${employeeToEditPermissions.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            has_work_portal_access: !!permissions.has_work_portal_access,
            has_hr_portal_access: !!permissions.has_hr_portal_access,
            has_client_portal_access: !!permissions.has_client_portal_access,
            has_inventory_portal_access:
              !!permissions.has_inventory_portal_access,
            has_super_admin_access: !!permissions.has_super_admin_access,
            has_accounts_portal_access:
              !!permissions.has_accounts_portal_access,
            has_admin_portal_access: !!permissions.has_admin_portal_access,
            has_showcase_portal_access:
              !!permissions.has_showcase_portal_access,
            updated_by: session?.user?.id || null,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update permissions");
      }
      const data = await response.json();
      toast.success(data.message || "Permissions updated successfully!", {
        position: "top-right",
      });
      await fetchEmployees(
        page,
        keyword,
        employeeType,
        employeeRole,
        department,
        employeeLevel
      );

      fetch(`${BASE_AUTH_URL}/api/user-auth/fetch-all`)
        .then((r) => r.json())
        .then((data) => setAllAuthUsers(data.data || data))
        .catch(() => {});
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error(error.message || "Failed to update permissions.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/employees/delete/${employeeToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete employee");
      }

      const data = await response.json();
      toast.success(data.message || "Employee deleted successfully!", {
        position: "top-right",
      });

      await fetchEmployees(
        page,
        keyword,
        employeeType,
        employeeRole,
        department,
        employeeLevel
      );
    } catch (error) {
      console.error("Failed to delete employee:", error);
      setFetchError(
        error.message || "Failed to delete employee. Please try again."
      );
      toast.error(error.message || "Failed to delete employee.", {
        position: "top-right",
      });
      handleCloseDeletePopover();
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (
    pageNum,
    search = "",
    type = null,
    role = null,
    dept = null,
    level = null
  ) => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
        ...(type && { employee_type: type.value }),
        ...(role && { employee_role: role.value }),
        ...(dept && { department: dept.value }),
        ...(level && { employee_level_id: level.value }),
      }).toString();

      const [employeesRes, rolesRes, departmentsRes, levelsRes] =
        await Promise.all([
          fetch(`${BASE_URL}/api/employees/list?${query}`),
          fetch(`${BASE_URL}/api/role/list?limit=1000`),
          fetch(`${BASE_URL}/api/department/list?limit=1000`),
          fetch(`${BASE_URL}/api/employee-level/list?limit=1000`),
        ]);

      if (
        !employeesRes.ok ||
        !rolesRes.ok ||
        !departmentsRes.ok ||
        !levelsRes.ok
      ) {
        throw new Error("Failed to fetch data");
      }

      const employeesData = await employeesRes.json();
      const rolesData = await rolesRes.json();
      const departmentsData = await departmentsRes.json();
      const levelsData = await levelsRes.json();

      const employees = (employeesData.data?.employees || [])
        .filter((emp) => emp && typeof emp === "object" && emp.id)
        .map((emp) => ({
          ...emp,
          role_name: emp.Role?.name || "-",
          department_name: emp.Department?.name || "-",
          manager_name: emp.manager?.name || "-",
          employee_level_name: emp.employeeLevel?.name || "-",
          designation: emp.designation || "-",
        }));

      if (employees.length !== employeesData.data?.employees?.length) {
        console.warn(
          "Filtered out invalid employee entries:",
          employeesData.data?.employees
        );
      }

      setEmployees(employees);
      setTotal(employeesData.data?.total || 0);

      const staticTypes = [
        { value: 1, label: "Current Employee" },
        { value: 0, label: "Ex-Employee" },
      ];
      const levels = (levelsData.data?.employeeLevels || []).map((level) => ({
        value: level.id,
        label: level.name,
      }));
      const roles = (rolesData.data?.roles || []).map((role) => ({
        value: role.name,
        label: role.name,
      }));
      const departments = (departmentsData.data?.departments || []).map(
        (dep) => ({
          value: dep.name,
          label: dep.name,
        })
      );

      setEmployeeTypeOptions(staticTypes);
      setEmployeeLevelOptions(levels);
      setAllRoleOptions(roles);
      setEmployeeRoleOptions(roles);
      setAllDepartmentOptions(departments);
      setDepartmentOptions(departments);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setFetchError("Failed to load employees. Please try again.");
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const filterRoles = (search) => {
    if (!search) {
      setEmployeeRoleOptions(allRoleOptions);
    } else {
      const filtered = allRoleOptions.filter((role) =>
        role.label.toLowerCase().includes(search.toLowerCase())
      );
      setEmployeeRoleOptions(filtered);
    }
  };

  const filterDepartments = (search) => {
    if (!search) {
      setDepartmentOptions(allDepartmentOptions);
    } else {
      const filtered = allDepartmentOptions.filter((dep) =>
        dep.label.toLowerCase().includes(search.toLowerCase())
      );
      setDepartmentOptions(filtered);
    }
  };

  const handleOpenImportNotes = () => {
    setImportNotesOpen(true);
    setImportedFiles([]);
    setImportResult(null);
  };
  const handleCloseImportNotes = () => {
    setImportNotesOpen(false);
    setImportedFiles([]);
    setImportResult(null);
  };
  const handleFileChange = (e) => {
    setImportedFiles(Array.from(e.target.files).slice(0, 1));
  };
  const handleImportNotes = async () => {
    if (importedFiles.length === 0) return;
    setLoading(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", importedFiles[0]);
      const response = await fetch(`${BASE_URL}/api/employee-note/import`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Import failed");
      }
      setImportResult(data);
      toast.success(data.message || "Import completed!", {
        position: "top-right",
      });
    } catch (error) {
      setImportResult({
        message: error.message,
        errors: [{ error: error.message }],
      });
      toast.error(error.message || "Failed to import notes.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(
      page,
      keyword,
      employeeType,
      employeeRole,
      department,
      employeeLevel
    );
  }, [page, keyword, employeeType, employeeRole, department, employeeLevel]);

  useEffect(() => {
    setPage(0);
  }, [keyword, employeeType, employeeRole, department, employeeLevel]);

  useEffect(() => {
    fetch(`${BASE_AUTH_URL}/api/user-auth/fetch-all`)
      .then((r) => r.json())
      .then((data) => setAllAuthUsers(data.data || data))
      .catch(() => setAllAuthUsers([]));
  }, []);

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No employees found
    </Box>
  );

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      border: `1px solid rgba(21,184,157,0.85)`,
      boxShadow: state.isFocused ? "0 0 0 1.5px rgba(21,184,157,0.85)" : "none",
      backgroundColor: "white",
      borderRadius: "4px",
      minHeight: "40px",
      "&:hover": {
        border: `1px solid rgba(21,184,157,0.85)`,
      },
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "rgba(21,184,157,0.85)"
        : state.isFocused
        ? "rgba(21,184,157,0.12)"
        : "white",
      color: state.isSelected ? "white" : "black",
      "&:hover": {
        backgroundColor: state.isSelected
          ? "rgba(21,184,157,0.85)"
          : "rgba(21,184,157,0.12)",
      },
    }),
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Employees ({total})
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenImportNotes}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <FaFileImport className="w-4 h-4" />
            <span>Import Notes</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="bg-[rgba(21,184,157,0.85)] hover:bg-[rgb(17,150,128)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <MdPersonAdd className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Employees"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="border border-[rgba(21,184,157,0.85)] bg-white rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-[rgba(21,184,157,0.85)] focus:border-[rgba(21,184,157,0.85)] placeholder-gray-400"
        />
        <Select
          options={employeeTypeOptions}
          value={employeeType}
          onChange={setEmployeeType}
          placeholder="Employee Type"
          styles={customSelectStyles}
          className="w-full md:w-1/5"
          isClearable
        />
        <Select
          options={employeeRoleOptions}
          value={employeeRole}
          onChange={setEmployeeRole}
          placeholder="Employee Role"
          styles={customSelectStyles}
          className="w-full md:w-1/5"
          isClearable
          onInputChange={filterRoles}
        />
        <Select
          options={departmentOptions}
          value={department}
          onChange={setDepartment}
          placeholder="Department"
          styles={customSelectStyles}
          className="w-full md:w-1/5"
          isClearable
          onInputChange={filterDepartments}
        />
        <Select
          options={employeeLevelOptions}
          value={employeeLevel}
          onChange={setEmployeeLevel}
          placeholder="Employee Level"
          styles={customSelectStyles}
          className="w-full md:w-1/5"
          isClearable
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#15b89d" height={50} width={5} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <>
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={employees}
              columns={columns}
              autoHeight
              initialState={{
                pagination: { paginationModel: { page, pageSize: limit } },
              }}
              pagination
              paginationMode="server"
              rowCount={total}
              onPaginationModelChange={(newModel) => setPage(newModel.page)}
              pageSizeOptions={[]}
              sx={{
                border: 0,
                boxShadow: "none",
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "rgba(21,184,157,0.12)",
                  color: "inherit",
                  "&:hover": {
                    backgroundColor: "rgba(21,184,157,0.12)",
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
                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell--sorted":
                  {
                    outline: "none",
                  },
              }}
              slots={{ noRowsOverlay: CustomNoRowsOverlay }}
              slotProps={{ pagination: { showrowsperpage: false.toString() } }}
            />
          </Paper>
        </>
      )}

      <EmployeeFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        employee={editEmployee}
        user={userForEmployeeForm}
      />

      <Dialog
        open={openCreateModal}
        onClose={handleCloseCreateModal}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          },
        }}
        sx={{
          "& .MuiDialog-paper": {
            margin: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            color: "#1f2937",
            px: 3,
            py: 2.5,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography
            variant="body1"
            sx={{ mb: 0.5, fontWeight: "bold", fontSize: "1.125rem" }}
          >
            Add Employee from User
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", fontSize: "0.875rem" }}
          >
            Select a user to create an employee record with their existing
            permissions
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <Box sx={{ textAlign: "center" }}>
                <BeatLoader color="#15b89d" size={12} />
                <Typography
                  variant="body2"
                  sx={{ mt: 2, color: "text.secondary" }}
                >
                  Loading available users...
                </Typography>
              </Box>
            </Box>
          ) : availableUsers.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6, px: 3 }}>
              <Typography variant="h6" sx={{ color: "text.secondary", mb: 1 }}>
                No Available Users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All users are already registered as employees.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: 500, overflow: "auto" }}>
              <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "medium" }}
                >
                  {availableUsers.length} user
                  {availableUsers.length !== 1 ? "s" : ""} available
                </Typography>
              </Box>
              <Box sx={{ p: 0 }}>
                {availableUsers.map((user, index) => (
                  <Box key={user.id}>
                    <Box
                      sx={{
                        borderBottom:
                          index < availableUsers.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                      }}
                    >
                      <Box
                        onClick={() => handleUserSelect(user)}
                        sx={{
                          py: 2.5,
                          px: 3,
                          cursor: "pointer",
                          backgroundColor:
                            selectedUser?.id === user.id
                              ? "rgba(42, 196, 171, 0.08)"
                              : "transparent",
                          "&:hover": {
                            backgroundColor:
                              selectedUser?.id === user.id
                                ? "rgba(42, 196, 171, 0.08)"
                                : "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            width: "100%",
                          }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              backgroundColor:
                                selectedUser?.id === user.id
                                  ? "#2ac4ab"
                                  : "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              mr: 2,
                              flexShrink: 0,
                              transition: "background 0.2s",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: "bold",
                                color:
                                  selectedUser?.id === user.id
                                    ? "white"
                                    : "#374151",
                                fontSize: "1.1rem",
                                textTransform: "uppercase",
                              }}
                            >
                              {user.name ? user.name.charAt(0) : "U"}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 500, mb: 0.5 }}
                            >
                              {user.name || "No Name"}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {user.email || "No Email"}
                            </Typography>
                            {user.phone && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                📞 {user.phone}
                              </Typography>
                            )}
                          </Box>
                          {selectedUser?.id === user.id && (
                            <Box
                              sx={{
                                ml: 2,
                                color: "#2ac4ab",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: "#2ac4ab",
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={handleCloseCreateModal}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateEmployeeFromUser}
            sx={
              !selectedUser || loading
                ? {}
                : {
                    backgroundColor: "rgba(21,184,157,0.85)",
                    color: "white",
                    border: "1px solid rgba(21,184,157,0.85)",
                    "&:hover": { backgroundColor: "rgba(17,150,128)" },
                  }
            }
            disabled={!selectedUser || loading}
            variant="contained"
          >
            {loading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BeatLoader color="#15b89d" size={6} />
                <span>Creating...</span>
              </Box>
            ) : (
              "Create Employee"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importNotesOpen}
        onClose={handleCloseImportNotes}
        maxWidth="xs"
        fullWidth
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          },
        }}
        sx={{
          "& .MuiDialog-paper": {
            margin: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            color: "#1f2937",
            px: 3,
            py: 2.5,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="body1" sx={{ mb: 0.5, fontSize: "1.125rem" }}>
            Import Notes
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#6b7280", fontSize: "0.875rem" }}
          >
            Select an Excel file to import employee notes
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {importResult ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 1, mt: 2 }}>
                {importResult.data?.message || importResult.message}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">Summary:</Typography>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>
                    Total Processed: {importResult.data?.totalProcessed ?? 0}
                  </li>
                  <li>
                    Total Imported: {importResult.data?.totalImported ?? 0}
                  </li>
                  <li>Total Errors: {importResult.data?.totalErrors ?? 0}</li>
                </ul>
              </Box>
              {importResult.data?.successful &&
                importResult.data.successful.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <p className="text-green-600">Successfully Imported:</p>
                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 1,
                        mb: 1,
                        p: 1,
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: 18, gap: 12 }}>
                        {importResult.data.successful.map((row, idx) => (
                          <li key={idx} style={{ fontSize: 13 }}>
                            Row {row.row}: Note ID {row.note.id} -{" "}
                            {row.note.notes}
                          </li>
                        ))}
                      </ul>
                    </Paper>
                  </Box>
                )}
              {importResult.data?.errors &&
                importResult.data.errors.length > 0 && (
                  <Box>
                    <p className="text-red-600">Errors:</p>
                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 1,
                        mb: 1,
                        p: 1,
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      <ul style={{ margin: 0, paddingLeft: 18, gap: 12 }}>
                        {importResult.data.errors.map((err, idx) => (
                          <li
                            key={idx}
                            style={{ fontSize: 13 }}
                            className="text-red-600"
                          >
                            Row {err.row ? err.row : "-"}: {err.error}
                          </li>
                        ))}
                      </ul>
                    </Paper>
                  </Box>
                )}
            </Box>
          ) : (
            <>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                style={{ display: "block", marginBottom: 16, marginTop: 20 }}
              />
              {importedFiles.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">Selected file:</Typography>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {importedFiles.map((file, idx) => (
                      <li key={idx} style={{ fontSize: 13 }}>
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Button
            onClick={handleCloseImportNotes}
            sx={{
              backgroundColor: "#ffebee",
              color: "#ef5350",
              "&:hover": { backgroundColor: "#ffcdd2" },
            }}
            disabled={loading}
          >
            {importResult ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              onClick={handleImportNotes}
              sx={
                importedFiles.length === 0 || loading
                  ? {}
                  : {
                      backgroundColor: "rgba(21,184,157,0.85)",
                      color: "white",
                      border: "1px solid rgba(21,184,157,0.85)",
                      "&:hover": { backgroundColor: "rgba(17,150,128)" },
                    }
              }
              disabled={importedFiles.length === 0 || loading}
              variant="contained"
            >
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BeatLoader color="#15b89d" size={6} />
                  <span>Importing...</span>
                </Box>
              ) : (
                "Import"
              )}
            </Button>
          )}
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
            <strong>{employeeToDelete?.name}</strong>?
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
              color="error"
              onClick={handleDeleteEmployee}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#15b89d" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>

      <Popover
        open={Boolean(permissionAnchorEl)}
        anchorEl={permissionAnchorEl}
        onClose={handleClosePermissionsPopover}
        anchorOrigin={{ vertical: "center", horizontal: "center" }}
        transformOrigin={{ vertical: "center", horizontal: "center" }}
        PaperProps={{
          sx: {
            width: { xs: "90%", sm: 400 },
            maxWidth: "100%",
            p: 3,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          },
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Edit Permissions for {employeeToEditPermissions?.name}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {Object.keys(permissions)
              .filter((key) => key !== "has_super_admin_access")
              .map((key) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Checkbox
                      checked={permissions[key]}
                      onChange={handlePermissionChange}
                      name={key}
                      sx={{
                        color: "#2ac4ab",
                        "&.Mui-checked": { color: "#2ac4ab" },
                        "&.Mui-focusVisible": {
                          outline: "2px solid rgba(21,184,157,0.85)",
                          outlineOffset: 2,
                        },
                      }}
                    />
                  }
                  label={key
                    .replace(/has_|_access/g, "")
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                  sx={{ textTransform: "capitalize" }}
                />
              ))}
            <Box
              sx={{
                backgroundColor: "#f5f5f5",
                borderRadius: 1,
                p: 1.5,
                mt: 2,
                display: "flex",
                alignItems: "center",
                fontWeight: "bold",
              }}
            >
              <FormControlLabel
                key="has_super_admin_access"
                control={
                  <Checkbox
                    checked={permissions["has_super_admin_access"]}
                    onChange={handlePermissionChange}
                    name="has_super_admin_access"
                    sx={{
                      color: "#e53935",
                      "&.Mui-checked": { color: "#e53935" },
                    }}
                  />
                }
                label={"Super Admin"}
                sx={{
                  textTransform: "capitalize",
                  fontWeight: "bold",
                  color: "#e53935",
                  flex: 1,
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}
          >
            <Button
              onClick={handleClosePermissionsPopover}
              sx={{
                backgroundColor: "#ffebee",
                color: "#ef5350",
                "&:hover": { backgroundColor: "#ffcdd2" },
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              sx={
                loading
                  ? {}
                  : {
                      backgroundColor: "rgba(21,184,157,0.85)",
                      color: "white",
                      border: "1px solid rgba(21,184,157,0.85)",
                      "&:hover": { backgroundColor: "rgba(17,150,128)" },
                    }
              }
              disabled={loading}
              variant="contained"
            >
              {loading ? <BeatLoader color="#15b89d" size={6} /> : "Save"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default Employees;
