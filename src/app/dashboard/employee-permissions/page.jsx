"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Paper, Switch, FormControlLabel, Checkbox } from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL, BASE_AUTH_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const Select = dynamic(() => import("react-select"), { ssr: false });

const ToggleSwitch = ({ checked, onChange }) => (
  <Switch
    checked={checked}
    onChange={onChange}
    sx={{
      "& .MuiSwitch-switchBase.Mui-checked": {
        color: "#4ade80",
      },
      "& .MuiSwitch-switchBase": {
        color: "#f87171",
      },
      "& .Mui-checked + .MuiSwitch-track": {
        backgroundColor: "#4ade80",
      },
      "& .MuiSwitch-track": {
        backgroundColor: "#f87171",
      },
    }}
  />
);

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

const handleTogglePermission = async (
  employee,
  key,
  session,
  employees,
  setEmployees
) => {
  try {
    if (!session?.user?.id) {
      toast.error("User session not found. Please sign in again.", {
        position: "top-right",
      });
      return;
    }

    if (parseInt(session?.user?.id) === parseInt(employee.user_id)) {
      toast.error("You cannot change your own permissions.", {
        position: "top-right",
      });
      return;
    }

    const newPermissions = {
      has_work_portal_access: !!employee.has_work_portal_access,
      has_hr_portal_access: !!employee.has_hr_portal_access,
      has_client_portal_access: !!employee.has_client_portal_access,
      has_inventory_portal_access: !!employee.has_inventory_portal_access,
      has_super_admin_access: !!employee.has_super_admin_access,
      has_accounts_portal_access: !!employee.has_accounts_portal_access,
      has_admin_portal_access: !!employee.has_admin_portal_access,
      has_showcase_portal_access: !!employee.has_showcase_portal_access,
    };
    newPermissions[key] = !employee[key];

    const userId = employee.user_id;
    const adminId = session.user.id;

    const authPayload = mapPermissionsToAuthDto(newPermissions);
    const authRes = await fetch(
      `${BASE_AUTH_URL}/api/user-auth/permission/${userId}/${adminId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authPayload),
      }
    );
    if (!authRes.ok) {
      const errorData = await authRes.json().catch(() => ({}));
      toast.error(
        errorData.message || "Failed to update user auth permissions",
        { position: "top-right" }
      );
      return;
    }

    const hrRes = await fetch(
      `${BASE_URL}/api/employees/permissions/update?id=${employee.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPermissions),
      }
    );
    if (!hrRes.ok) {
      const errorData = await hrRes.json().catch(() => ({}));
      toast.error(errorData.message || "Failed to update HR permissions", {
        position: "top-right",
      });
      return;
    }

    toast.success("Permissions updated successfully!", {
      position: "top-right",
    });

    setEmployees(
      employees.map((emp) =>
        emp.id === employee.id ? { ...emp, ...newPermissions } : emp
      )
    );
  } catch (error) {
    console.error("Failed to update permissions:", error);
    toast.error("Failed to update permissions.", { position: "top-right" });
  }
};

const EmployeePermissions = () => {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [employeeType, setEmployeeType] = useState({
    value: 1,
    label: "Current Employee",
  });
  const [employeeRole, setEmployeeRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [employeeLevel, setEmployeeLevel] = useState(null);

  const [workPortalAccess, setWorkPortalAccess] = useState(null);
  const [hrPortalAccess, setHrPortalAccess] = useState(null);
  const [clientPortalAccess, setClientPortalAccess] = useState(null);
  const [inventoryPortalAccess, setInventoryPortalAccess] = useState(null);
  const [superAdminAccess, setSuperAdminAccess] = useState(null);
  const [accountsPortalAccess, setAccountsPortalAccess] = useState(null);
  const [adminPortalAccess, setAdminPortalAccess] = useState(null);
  const [showcasePortalAccess, setShowcasePortalAccess] = useState(null);

  const [employeeTypeOptions, setEmployeeTypeOptions] = useState([]);
  const [employeeRoleOptions, setEmployeeRoleOptions] = useState([]);
  const [allRoleOptions, setAllRoleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [allDepartmentOptions, setAllDepartmentOptions] = useState([]);
  const [employeeLevelOptions, setEmployeeLevelOptions] = useState([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch(
            `${BASE_AUTH_URL}/api/user-auth/isadmin/${session.user.id}`
          );
          const data = await res.json();
          setIsAdmin(data?.data?.isAdmin === true);
        } catch (e) {
          setIsAdmin(false);
        } finally {
          setAdminChecked(true);
        }
      } else {
        setIsAdmin(false);
        setAdminChecked(true);
      }
    };
    checkAdmin();
  }, [session]);

  const fetchEmployees = async (
    pageNum,
    search = "",
    type = null,
    role = null,
    dept = null,
    level = null,
    workPortal = null,
    hrPortal = null,
    clientPortal = null,
    inventoryPortal = null,
    superAdmin = null,
    accountsPortal = null,
    adminPortal = null,
    showcasePortal = null
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
        ...(workPortal !== null && {
          has_work_portal_access: workPortal.value,
        }),
        ...(hrPortal !== null && { has_hr_portal_access: hrPortal.value }),
        ...(clientPortal !== null && {
          has_client_portal_access: clientPortal.value,
        }),
        ...(inventoryPortal !== null && {
          has_inventory_portal_access: inventoryPortal.value,
        }),
        ...(superAdmin !== null && {
          has_super_admin_access: superAdmin.value,
        }),
        ...(accountsPortal !== null && {
          has_accounts_portal_access: accountsPortal.value,
        }),
        ...(adminPortal !== null && {
          has_admin_portal_access: adminPortal.value,
        }),
        ...(showcasePortal !== null && {
          has_showcase_portal_access: showcasePortal.value,
        }),
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
        .filter(
          (employee) => employee && typeof employee === "object" && employee.id
        )
        .map((employee) => ({
          ...employee,
          name: employee.name || "-",
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
      toast.error("Failed to load employees.", { position: "top-right" });
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
      searchQuery,
      employeeType,
      employeeRole,
      department,
      employeeLevel,
      workPortalAccess,
      hrPortalAccess,
      clientPortalAccess,
      inventoryPortalAccess,
      superAdminAccess,
      accountsPortalAccess,
      adminPortalAccess,
      showcasePortalAccess
    );
  }, [
    page,
    searchQuery,
    employeeType,
    employeeRole,
    department,
    employeeLevel,
    workPortalAccess,
    hrPortalAccess,
    clientPortalAccess,
    inventoryPortalAccess,
    superAdminAccess,
    accountsPortalAccess,
    adminPortalAccess,
    showcasePortalAccess,
  ]);

  useEffect(() => {
    setPage(0);
  }, [
    searchQuery,
    employeeType,
    employeeRole,
    department,
    employeeLevel,
    workPortalAccess,
    hrPortalAccess,
    clientPortalAccess,
    inventoryPortalAccess,
    superAdminAccess,
    accountsPortalAccess,
    adminPortalAccess,
    showcasePortalAccess,
  ]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No employees found
    </Box>
  );

  const renderPermissionCell = (row, key) => {
    if (isAdmin) {
      return (
        <ToggleSwitch
          checked={row[key]}
          onChange={() =>
            handleTogglePermission(row, key, session, employees, setEmployees)
          }
        />
      );
    } else {
      return row[key] ? (
        <FaCheckCircle color="#4ade80" size={20} className="mt-3" />
      ) : (
        <FaTimesCircle color="#f87171" size={20} className="mt-3" />
      );
    }
  };

  const columns = [
    { field: "name", headerName: "Employee Name", width: 200 },
    {
      field: "super_admin",
      headerName: "Super Admin",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_super_admin_access"),
      cellClassName: "super-admin-cell",
      headerClassName: "super-admin-header",
    },
    {
      field: "work_portal",
      headerName: "Work Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_work_portal_access"),
    },
    {
      field: "hr_portal",
      headerName: "HR Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_hr_portal_access"),
    },
    {
      field: "client_portal",
      headerName: "Client Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_client_portal_access"),
    },
    {
      field: "inventory_portal",
      headerName: "Inventory Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_inventory_portal_access"),
    },
    {
      field: "accounts_portal",
      headerName: "Accounts Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_accounts_portal_access"),
    },
    {
      field: "admin_portal",
      headerName: "Admin Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_admin_portal_access"),
    },
    {
      field: "showcase_portal",
      headerName: "Showcase Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        renderPermissionCell(params.row, "has_showcase_portal_access"),
    },
  ];

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

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Employee Permissions ({total})
        </h1>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Employees"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
        />
        <Select
          options={employeeTypeOptions}
          value={employeeType}
          onChange={setEmployeeType}
          placeholder="Employee Type"
          className="w-full md:w-1/5"
          isClearable
          styles={customSelectStyles}
        />
        <Select
          options={employeeRoleOptions}
          value={employeeRole}
          onChange={setEmployeeRole}
          placeholder="Employee Role"
          className="w-full md:w-1/5"
          isClearable
          onInputChange={filterRoles}
          styles={customSelectStyles}
        />
        <Select
          options={departmentOptions}
          value={department}
          onChange={setDepartment}
          placeholder="Department"
          className="w-full md:w-1/5"
          isClearable
          onInputChange={filterDepartments}
          styles={customSelectStyles}
        />
        <Select
          options={employeeLevelOptions}
          value={employeeLevel}
          onChange={setEmployeeLevel}
          placeholder="Employee Level"
          className="w-full md:w-1/5"
          isClearable
          styles={customSelectStyles}
        />
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <FormControlLabel
          control={
            <Checkbox
              checked={!!workPortalAccess}
              onChange={(e) =>
                setWorkPortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Work Portal Access"
          className="w-full md:w-1/4"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!hrPortalAccess}
              onChange={(e) =>
                setHrPortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="HR Portal Access"
          className="w-full md:w-1/4"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!clientPortalAccess}
              onChange={(e) =>
                setClientPortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Client Portal Access"
          className="w-full md:w-1/4"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!inventoryPortalAccess}
              onChange={(e) =>
                setInventoryPortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Inventory Portal Access"
          className="w-full md:w-1/4"
        />
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <FormControlLabel
          control={
            <Checkbox
              checked={!!superAdminAccess}
              onChange={(e) =>
                setSuperAdminAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Super Admin Access"
          className="w-full md:w-1/4"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!accountsPortalAccess}
              onChange={(e) =>
                setAccountsPortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Accounts Portal Access"
          className="w-full md:w-1/4"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!adminPortalAccess}
              onChange={(e) =>
                setAdminPortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Admin Portal Access"
          className="w-full md:w-1/4"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={!!showcasePortalAccess}
              onChange={(e) =>
                setShowcasePortalAccess(
                  e.target.checked ? { value: 1, label: "Has Access" } : null
                )
              }
              color="primary"
              sx={{
                color: "#2ac4ab",
                "&.Mui-checked": {
                  color: "#2ac4ab",
                },
              }}
            />
          }
          label="Showcase Portal Access"
          className="w-full md:w-1/4"
        />
      </div>

      {!adminChecked ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" height={50} width={5} />
        </div>
      ) : loading ? (
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
              slots={{
                noRowsOverlay: CustomNoRowsOverlay,
              }}
              slotProps={{
                pagination: {
                  showrowsperpage: "false",
                },
              }}
            />
          </Paper>
        </>
      )}
    </div>
  );
};

export default EmployeePermissions;
