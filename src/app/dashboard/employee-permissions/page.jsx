"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Paper } from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Select = dynamic(() => import("react-select"), { ssr: false });

const EmployeePermissions = () => {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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

  const columns = [
    { field: "name", headerName: "Employee Name", width: 200 },
    {
      field: "work_portal",
      headerName: "Work Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_work_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "hr_portal",
      headerName: "HR Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_hr_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "client_portal",
      headerName: "Client Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_client_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "inventory_portal",
      headerName: "Inventory Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_inventory_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "super_admin",
      headerName: "Super Admin",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_super_admin_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "accounts_portal",
      headerName: "Accounts Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_accounts_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "admin_portal",
      headerName: "Admin Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_admin_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
    {
      field: "showcase_portal",
      headerName: "Showcase Portal",
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.has_showcase_portal_access ? (
          <FaCheckCircle className="w-5 h-5 text-green-500 mt-3" />
        ) : (
          <FaTimesCircle className="w-5 h-5 text-red-500 mt-3" />
        ),
    },
  ];

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

      {/* Portal Access Filters */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={workPortalAccess}
          onChange={setWorkPortalAccess}
          placeholder="Work Portal Access"
          className="w-full md:w-1/4"
          isClearable
        />
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={hrPortalAccess}
          onChange={setHrPortalAccess}
          placeholder="HR Portal Access"
          className="w-full md:w-1/4"
          isClearable
        />
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={clientPortalAccess}
          onChange={setClientPortalAccess}
          placeholder="Client Portal Access"
          className="w-full md:w-1/4"
          isClearable
        />
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={inventoryPortalAccess}
          onChange={setInventoryPortalAccess}
          placeholder="Inventory Portal Access"
          className="w-full md:w-1/4"
          isClearable
        />
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={superAdminAccess}
          onChange={setSuperAdminAccess}
          placeholder="Super Admin Access"
          className="w-full md:w-1/4"
          isClearable
        />
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={accountsPortalAccess}
          onChange={setAccountsPortalAccess}
          placeholder="Accounts Portal Access"
          className="w-full md:w-1/4"
          isClearable
        />
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={adminPortalAccess}
          onChange={setAdminPortalAccess}
          placeholder="Admin Portal Access"
          className="w-full md:w-1/4"
          isClearable
        />
        <Select
          options={[
            { value: 1, label: "Has Access" },
            { value: 0, label: "No Access" },
          ]}
          value={showcasePortalAccess}
          onChange={setShowcasePortalAccess}
          placeholder="Showcase Portal Access"
          className="w-full md:w-1/4"
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
