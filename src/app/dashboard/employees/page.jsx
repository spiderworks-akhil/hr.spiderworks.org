"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MdOutlineSecurity, MdEdit, MdDelete } from "react-icons/md";
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
} from "@mui/material";
import moment from "moment";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import EmployeeFormPopup from "@/components/dashboard/employee-create-form/EmployeeForm";
import { BASE_URL } from "@/services/baseUrl";

const Select = dynamic(() => import("react-select"), { ssr: false });

const Employees = () => {
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

  const columns = [
    {
      field: "name",
      headerName: "Name",
      width: 200,
      renderCell: (params) => (
        <Link
          href={`/dashboard/employees/${params.row.id}`}
          className="text-blue-600 hover:text-blue-700 cursor-pointer"
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

  const handleOpenEditDialog = (employee) => {
    setEditEmployee(employee);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditEmployee(null);
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
    setPermissions({
      has_work_portal_access: !!employee.has_work_portal_access,
      has_hr_portal_access: !!employee.has_hr_portal_access,
      has_client_portal_access: !!employee.has_client_portal_access,
      has_inventory_portal_access: !!employee.has_inventory_portal_access,
      has_super_admin_access: !!employee.has_super_admin_access,
      has_accounts_portal_access: !!employee.has_accounts_portal_access,
      has_admin_portal_access: !!employee.has_admin_portal_access,
      has_showcase_portal_access: !!employee.has_showcase_portal_access,
    });
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

  const handleUpdatePermissions = async () => {
    if (!employeeToEditPermissions) return;
    handleClosePermissionsPopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/employees/permissions/update?id=${employeeToEditPermissions.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(permissions),
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
    } catch (error) {
      console.error("Failed to update permissions:", error);
      setFetchError(
        error.message || "Failed to update permissions. Please try again."
      );
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

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No employees found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Employees ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Employee</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Employees"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
        />
        <Select
          options={employeeTypeOptions}
          value={employeeType}
          onChange={setEmployeeType}
          placeholder="Employee Type"
          className="w-full md:w-1/5"
          isClearable
        />
        <Select
          options={employeeRoleOptions}
          value={employeeRole}
          onChange={setEmployeeRole}
          placeholder="Employee Role"
          className="w-full md:w-1/5"
          isClearable
          onInputChange={filterRoles}
        />
        <Select
          options={departmentOptions}
          value={department}
          onChange={setDepartment}
          placeholder="Department"
          className="w-full md:w-1/5"
          isClearable
          onInputChange={filterDepartments}
        />
        <Select
          options={employeeLevelOptions}
          value={employeeLevel}
          onChange={setEmployeeLevel}
          placeholder="Employee Level"
          className="w-full md:w-1/5"
          isClearable
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" height={50} width={5} />
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
      />

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
              {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
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
            {Object.keys(permissions).map((key) => (
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
          </Box>
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}
          >
            <Button
              variant="outlined"
              size="small"
              onClick={handleClosePermissionsPopover}
              sx={{
                borderColor: "#2ac4ab",
                color: "#2ac4ab",
                "&:hover": { borderColor: "#26a69a", color: "#26a69a" },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleUpdatePermissions}
              disabled={loading}
              sx={{
                backgroundColor: "#2ac4ab",
                "&:hover": { backgroundColor: "#26a69a" },
              }}
            >
              {loading ? <BeatLoader color="#fff" size={8} /> : "Save"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default Employees;
