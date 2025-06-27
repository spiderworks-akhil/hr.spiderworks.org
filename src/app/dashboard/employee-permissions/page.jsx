"use client";

import { useState, useEffect } from "react";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Paper } from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast, { Toaster } from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const EmployeePermissions = () => {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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

  const fetchEmployees = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(`${BASE_URL}/api/employees/list?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }

      const data = await response.json();
      const employees = (data.data?.employees || [])
        .filter(
          (employee) => employee && typeof employee === "object" && employee.id
        )
        .map((employee) => ({
          ...employee,
          name: employee.name || "-",
        }));

      if (employees.length !== data.data?.employees?.length) {
        console.warn(
          "Filtered out invalid employee entries:",
          data.data?.employees
        );
      }

      setEmployees(employees);
      setTotal(data.data?.total || 0);
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

  useEffect(() => {
    fetchEmployees(page, searchQuery);
  }, [page, searchQuery]);

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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" height={50} width={5} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <input
              type="text"
              placeholder="Search Employees"
              value={searchQuery}
              onChange={handleSearchChange}
              className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
            />
          </div>

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
