"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import EmployeeEvaluationTemplateFormPopup from "@/components/dashboard/employee-evaluation-template-form/EmployeeEvaluationTemplateForm";
import { BASE_URL } from "@/services/baseUrl";

const EmployeeEvaluationTemplates = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);

  const columns = [
    {
      field: "name",
      headerName: "Template Name",
      width: 200,
      renderCell: (params) => (
        <button
          onClick={() =>
            router.push(
              `/dashboard/employee-evaluation-template/${params.row.id}`
            )
          }
          className="text-blue-600 hover:underline"
          aria-label={`View template ${params.value}`}
        >
          {params.value}
        </button>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => params.value || "Draft",
    },
    {
      field: "rate_by_client",
      headerName: "Client Ratable",
      width: 120,
      renderCell: (params) => (params.value ? "Yes" : "No"),
    },
    {
      field: "rate_by_manager",
      headerName: "Manager Ratable",
      width: 120,
      renderCell: (params) => (params.value ? "Yes" : "No"),
    },
    {
      field: "rate_by_self",
      headerName: "Self Ratable",
      width: 120,
      renderCell: (params) => (params.value ? "Yes" : "No"),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit template"
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
          aria-label="Delete template"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditTemplate(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (template) => {
    setEditTemplate(template);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditTemplate(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditTemplate(null);
    fetchTemplates(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, template) => {
    setAnchorEl(event.currentTarget);
    setTemplateToDelete(template);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setTemplateToDelete(null);
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/employee-evaluation-templates/delete/${templateToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete template");
      }

      const data = await response.json();
      toast.success(data.message || "Template deleted successfully!", {
        position: "top-right",
      });

      await fetchTemplates(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete template:", error);
      setFetchError(
        error.message || "Failed to delete template. Please try again."
      );
      toast.error(error.message || "Failed to delete template.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/employee-evaluation-templates/list?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch templates");
      }

      const data = await response.json();
      const templates = (data.data?.templates || [])
        .filter(
          (template) => template && typeof template === "object" && template.id
        )
        .map((template) => ({
          ...template,
          name: template.name || "-",
          status: template.status || "Draft",
          rate_by_client: template.rate_by_client || 0,
          rate_by_manager: template.rate_by_manager || 0,
          rate_by_self: template.rate_by_self || 0,
        }));

      if (templates.length !== data.data?.templates?.length) {
        console.warn("Filtered out invalid template entries:", data.templates);
      }

      setTemplates(templates);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      setFetchError("Failed to load templates. Please try again.");
      setTemplates([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No templates found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Evaluation Templates ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Template</span>
        </button>
      </div>
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Templates"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
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
              rows={templates}
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
                  showRowsPerPage: false,
                },
              }}
            />
          </Paper>
        </>
      )}

      <EmployeeEvaluationTemplateFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        template={editTemplate}
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
            <strong>{templateToDelete?.name}</strong>?
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
              onClick={handleDeleteTemplate}
              disabled={loading}
            >
              {loading ? <BeatLoader color="#fff" size={8} /> : "Delete"}
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
};

export default EmployeeEvaluationTemplates;
