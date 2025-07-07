"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";
import { useSession } from "next-auth/react";

const RecruitmentRequestFormPopup = dynamic(
  () =>
    import(
      "@/components/dashboard/recruitment-request-form/RecruitmentRequestFormPopup"
    ),
  { ssr: false }
);

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

const RecruitmentRequestPage = () => {
  const { data: session } = useSession();
  const [recruitmentRequests, setRecruitmentRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [requestedBy, setRequestedBy] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const [userOptions, setUserOptions] = useState([]);

  const statusOptions = [
    { value: "REQUESTED", label: "Requested" },
    { value: "NOT_APPROVED", label: "Not Approved" },
    { value: "APPROVED", label: "Approved" },
    { value: "INTERVIEWING", label: "Interviewing" },
    { value: "HIRED", label: "Hired" },
    { value: "ARCHIVED", label: "Archived" },
  ];

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  const columns = [
    {
      field: "job_title",
      headerName: "Job Title",
      width: 150,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "internal_requirement",
      headerName: "Internal Requirement",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "public_job_post_content",
      headerName: "Public Job Post",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "estimated_hiring_days",
      headerName: "Est. Hiring Days",
      width: 120,
      renderCell: (params) => <span>{params.value ?? "-"}</span>,
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 100,
      renderCell: (params) => (
        <span>
          {params.value
            ? params.value
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "-"}
        </span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <span>
          {params.value
            ? params.value
                .replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : "-"}
        </span>
      ),
    },
    {
      field: "hiring_remarks_by_hr",
      headerName: "HR Remarks",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "requestedBy",
      headerName: "Requested By",
      width: 150,
      renderCell: (params) => <span>{params.value?.name || "-"}</span>,
    },
    {
      field: "requested_date",
      headerName: "Requested Date",
      width: 120,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit recruitment request"
          className="p-1"
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
          onClick={(event) => handleOpenDeletePopover(event, params.row)}
          aria-label="Delete recruitment request"
          className="p-1"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditRequest(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (request) => {
    setEditRequest(request);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditRequest(null);
  };

  const handleOpenDeletePopover = (event, request) => {
    setAnchorEl(event.currentTarget);
    setRequestToDelete(request);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setRequestToDelete(null);
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/recruitment-requests/delete/${requestToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete recruitment request"
        );
      }

      const data = await response.json();
      toast.success(
        data.message || "Recruitment request deleted successfully!",
        {
          position: "top-right",
        }
      );

      await fetchRecruitmentRequests();
    } catch (error) {
      console.error("Failed to delete recruitment request:", error);
      setFetchError(
        error.message ||
          "Failed to delete recruitment request. Please try again."
      );
      toast.error(error.message || "Failed to delete recruitment request.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruitmentRequests = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(requestedBy && { requested_by: requestedBy.toString() }),
        ...(status && { status }),
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/recruitment-requests/list?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch recruitment requests");
      }

      const data = await response.json();
      const records = (data.data?.requests || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid recruitment request entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          job_title: record.job_title || null,
          internal_requirement: record.internal_requirement || null,
          public_job_post_content: record.public_job_post_content || null,
          estimated_hiring_days: record.estimated_hiring_days || null,
          priority: record.priority || null,
          status: record.status || null,
          hiring_remarks_by_hr: record.hiring_remarks_by_hr || null,
          requestedBy: record.requestedBy || null,
          requested_date: record.requested_date || null,
          createdBy: record.createdBy || null,
          updatedBy: record.updatedBy || null,
        }));

      setRecruitmentRequests(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch recruitment requests:", error);
      setFetchError("Failed to load recruitment requests. Please try again.");
      setRecruitmentRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/list`);
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        const options = data.data?.users.map((user) => ({
          value: user.id,
          label: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
        }));
        setUserOptions(options);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users.", { position: "top-right" });
      }
    };

    fetchUsers();
    fetchRecruitmentRequests();
  }, [page, requestedBy, status]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    if (field === "requestedBy") {
      setRequestedBy(value);
    } else if (field === "status") {
      setStatus(value);
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditRequest(null);
    fetchRecruitmentRequests();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No recruitment requests found
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="min-h-screen bg-white p-4">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Recruitment Requests ({total})
          </h1>
          <Button
            onClick={handleOpenAddDialog}
            sx={{
              backgroundColor: "rgb(42,196,171)",
              color: "white",
              "&:hover": { backgroundColor: "rgb(36,170,148)" },
              padding: "8px 16px",
              borderRadius: "8px",
            }}
          >
            + Add Recruitment Request
          </Button>
        </div>

        <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
          <Box width={{ xs: "100%", sm: "200px" }}>
            <label className="block mb-1">Requested By</label>
            <Select
              options={userOptions}
              value={
                userOptions.find((opt) => opt.value === requestedBy) || null
              }
              onChange={(selected) =>
                handleFilterChange(
                  "requestedBy",
                  selected ? selected.value : null
                )
              }
              styles={customSelectStyles}
              placeholder="Requested By..."
              isClearable
            />
          </Box>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <label className="block mb-1">Status</label>
            <Select
              options={statusOptions}
              value={statusOptions.find((opt) => opt.value === status) || null}
              onChange={(selected) =>
                handleFilterChange("status", selected ? selected.value : null)
              }
              styles={customSelectStyles}
              placeholder="Status..."
              isClearable
            />
          </Box>
        </Box>

        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="64"
          >
            <BeatLoader color="#2ac4ab" size={15} />
          </Box>
        ) : fetchError ? (
          <Box textAlign="center" color="red" py={10}>
            {fetchError}
          </Box>
        ) : (
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={recruitmentRequests}
              getRowId={(row) => row.id}
              columns={columns}
              autoHeight
              initialState={{
                pagination: { paginationModel: { page, pageSize: limit } },
              }}
              pagination
              paginationMode="server"
              rowCount={total}
              onPaginationModelChange={(newModel) => setPage(newModel.page)}
              loading={loading}
              sx={{
                border: 0,
                boxShadow: "none",
                "& .MuiDataGrid-row.Mui-selected": {
                  backgroundColor: "rgba(234, 248, 244, 0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(234, 248, 244, 0.8)",
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
                  showrowsperpage: "false",
                },
              }}
            />
          </Paper>
        )}

        <RecruitmentRequestFormPopup
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
          recruitmentRequest={editRequest}
          loggedInUserId={session?.user?.id}
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
              Are you sure you want to delete recruitment request for{" "}
              <strong className="font-bold">
                {requestToDelete?.job_title}
              </strong>
              ?
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
                onClick={handleDeleteRequest}
                color="error"
                disabled={loading}
              >
                {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
              </Button>
            </Box>
          </Box>
        </Popover>
      </div>
    </LocalizationProvider>
  );
};

export default RecruitmentRequestPage;
