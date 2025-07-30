"use client";

import { useState, useEffect, useMemo } from "react";
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
  accounts: !!permissions.has_accounts_portal_access,
  works: !!permissions.has_work_portal_access,
  hr: !!permissions.has_hr_portal_access,
  client: !!permissions.has_client_portal_access,
  inventory: !!permissions.has_inventory_portal_access,
  super_admin: !!permissions.has_super_admin_access,
  admin: !!permissions.has_admin_portal_access,
  showcase: !!permissions.has_showcase_portal_access,
  type: "HR",
});

const permissionKeyMap = {
  has_work_portal_access: "work",
  has_hr_portal_access: "hr",
  has_client_portal_access: "client",
  has_inventory_portal_access: "inventory",
  has_super_admin_access: "super_admin",
  has_accounts_portal_access: "account",
  has_admin_portal_access: "admin",
  has_showcase_portal_access: "showcase",
};

const EmployeePermissions = () => {
  const { data: session } = useSession();

  const [allAuthUsers, setAllAuthUsers] = useState([]);
  const [allLocalUsers, setAllLocalUsers] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const [workPortalAccess, setWorkPortalAccess] = useState(null);
  const [hrPortalAccess, setHrPortalAccess] = useState(null);
  const [clientPortalAccess, setClientPortalAccess] = useState(null);
  const [inventoryPortalAccess, setInventoryPortalAccess] = useState(null);
  const [superAdminAccess, setSuperAdminAccess] = useState(null);
  const [accountsPortalAccess, setAccountsPortalAccess] = useState(null);
  const [adminPortalAccess, setAdminPortalAccess] = useState(null);
  const [showcasePortalAccess, setShowcasePortalAccess] = useState(null);

  const employeeTypeOptions = [
    { value: 1, label: "Current Employee" },
    { value: 0, label: "Ex-Employee" },
  ];
  const [employeeType, setEmployeeType] = useState(employeeTypeOptions[0]);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    Promise.all([
      fetch(`${BASE_AUTH_URL}/api/user-auth/fetch-all`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/users/list?limit=100000`).then((r) => r.json()),
      fetch(`${BASE_URL}/api/employees/list?limit=10000`).then((r) => r.json()),
    ])
      .then(([authUsers, localUsers, employees]) => {
        setAllAuthUsers(authUsers.data || authUsers);
        setAllLocalUsers(localUsers.data?.users || []);
        setAllEmployees(employees.data?.employees || []);
      })
      .catch((err) => {
        setFetchError("Failed to load users/employees.");
        setAllAuthUsers([]);
        setAllLocalUsers([]);
        setAllEmployees([]);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const getUserPermissions = (user) => {
    const p = user.permissions || {};
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

  const employeeUserIds = useMemo(() => {
    if (!employeeType) {
      return new Set(allEmployees.map((e) => String(e.user_id)));
    }
    return new Set(
      allEmployees
        .filter((e) => e.employee_type === employeeType.value)
        .map((e) => String(e.user_id))
    );
  }, [allEmployees, employeeType]);
  const userIdToEmployee = useMemo(() => {
    const map = {};
    allEmployees.forEach((e) => {
      if (e.user_id) map[String(e.user_id)] = e;
    });
    return map;
  }, [allEmployees]);

  const filteredUsers = useMemo(() => {
    let users = allAuthUsers;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phone && u.phone.toLowerCase().includes(q))
      );
    }
    if (employeeType) {
      users = users.filter((u) => employeeUserIds.has(String(u.id)));
    }
    const permFilters = [
      [workPortalAccess, "work"],
      [hrPortalAccess, "hr"],
      [clientPortalAccess, "client"],
      [inventoryPortalAccess, "inventory"],
      [superAdminAccess, "super_admin"],
      [accountsPortalAccess, "account"],
      [adminPortalAccess, "admin"],
      [showcasePortalAccess, "showcase"],
    ];
    for (const [val, key] of permFilters) {
      if (val) {
        users = users.filter((u) => u.permissions?.[key]);
      }
    }
    return users;
  }, [
    allAuthUsers,
    searchQuery,
    employeeType,
    workPortalAccess,
    hrPortalAccess,
    clientPortalAccess,
    inventoryPortalAccess,
    superAdminAccess,
    accountsPortalAccess,
    adminPortalAccess,
    showcasePortalAccess,
    employeeUserIds,
  ]);

  const paginatedUsers = useMemo(() => {
    const start = page * limit;
    return filteredUsers.slice(start, start + limit);
  }, [filteredUsers, page, limit]);

  const SUPER_ADMIN_COL_KEY = "has_super_admin_access";
  const superAdminCellClass = "super-admin-cell";
  const superAdminHeaderClass = "super-admin-header";

  const columns = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "email", headerName: "Email", width: 200 },
    ...[
      "has_super_admin_access",
      "has_work_portal_access",
      "has_hr_portal_access",
      "has_client_portal_access",
      "has_inventory_portal_access",
      "has_accounts_portal_access",
      "has_admin_portal_access",
      "has_showcase_portal_access",
    ].map((key) => ({
      field: key,
      headerName: key
        .replace(/has_|_access/g, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      width: 120,
      sortable: false,
      renderCell: (params) => renderPermissionCell(params.row, key),
      ...(key === SUPER_ADMIN_COL_KEY
        ? {
            cellClassName: superAdminCellClass,
            headerClassName: superAdminHeaderClass,
          }
        : {}),
    })),
  ];

  const renderPermissionCell = (row, key) => {
    const permissions = getUserPermissions(row);
    if (isAdmin) {
      return (
        <ToggleSwitch
          checked={!!permissions[key]}
          onChange={() => handleTogglePermission(row, key)}
        />
      );
    } else {
      return permissions[key] ? (
        <FaCheckCircle color="#4ade80" size={20} className="mt-3" />
      ) : (
        <FaTimesCircle color="#f87171" size={20} className="mt-3" />
      );
    }
  };

  const handleTogglePermission = async (user, key) => {
    try {
      if (!session?.user?.id) {
        toast.error("User session not found. Please sign in again.", {
          position: "top-right",
        });
        return;
      }
      if (parseInt(session?.user?.id) === parseInt(user.id)) {
        toast.error("You cannot change your own permissions.", {
          position: "top-right",
        });
        return;
      }
      const oldPerms = getUserPermissions(user);
      const newPermissions = { ...oldPerms, [key]: !oldPerms[key] };
      const authPayload = mapPermissionsToAuthDto(newPermissions);

      const authRes = await fetch(
        `${BASE_AUTH_URL}/api/user-auth/permission/${user.id}/${session.user.id}`,
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
      const matchingEmployees = allEmployees.filter(
        (e) => String(e.user_id) === String(user.id)
      );
      for (const employee of matchingEmployees) {
        const hrRes = await fetch(
          `${BASE_URL}/api/employees/permissions/update?id=${employee.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              has_work_portal_access: !!newPermissions.has_work_portal_access,
              has_hr_portal_access: !!newPermissions.has_hr_portal_access,
              has_client_portal_access:
                !!newPermissions.has_client_portal_access,
              has_inventory_portal_access:
                !!newPermissions.has_inventory_portal_access,
              has_super_admin_access: !!newPermissions.has_super_admin_access,
              has_accounts_portal_access:
                !!newPermissions.has_accounts_portal_access,
              has_admin_portal_access: !!newPermissions.has_admin_portal_access,
              has_showcase_portal_access:
                !!newPermissions.has_showcase_portal_access,
              updated_by: session?.user?.id || null,
            }),
          }
        );
        if (!hrRes.ok) {
          const errorData = await hrRes.json().catch(() => ({}));
          toast.error(errorData.message || "Failed to update HR permissions", {
            position: "top-right",
          });
          return;
        }
      }
      toast.success("Permissions updated successfully!", {
        position: "top-right",
      });

      setAllAuthUsers((prev) =>
        prev.map((u) => {
          if (u.id === user.id) {
            const updatedPermissions = { ...(u.permissions || {}) };

            const backendKey = permissionKeyMap[key];
            if (backendKey) {
              updatedPermissions[backendKey] = !oldPerms[key];
            }
            return {
              ...u,
              permissions: updatedPermissions,
            };
          }
          return u;
        })
      );
    } catch (error) {
      console.error("Failed to update permissions:", error);
      toast.error("Failed to update permissions.", { position: "top-right" });
    }
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>No users found</Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          User Access Management ({filteredUsers.length})
        </h1>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Users"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
        />
        <Select
          options={employeeTypeOptions}
          value={employeeType}
          onChange={(option) => {
            setEmployeeType(option);
            setPage(0);
          }}
          placeholder="Employee Type"
          className="w-full md:w-1/5"
          isClearable={true}
          styles={{
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
          }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              sx={{ color: "#2ac4ab", "&.Mui-checked": { color: "#2ac4ab" } }}
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
              rows={paginatedUsers}
              columns={columns}
              autoHeight
              initialState={{
                pagination: { paginationModel: { page, pageSize: limit } },
              }}
              pagination
              paginationMode="server"
              rowCount={filteredUsers.length}
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

                "& .super-admin-cell": {
                  backgroundColor: "#fffbe6",
                },
                "& .super-admin-header": {
                  backgroundColor: "#fffbe6",
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
