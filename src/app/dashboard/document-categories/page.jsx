"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import DocumentCategoryFormPopup from "@/components/dashboard/document-category-create-form/DocumentCategoryForm";
import { BASE_URL } from "@/services/baseUrl";

const DocumentCategories = () => {
  const [documentCategories, setDocumentCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [documentCategoryToDelete, setDocumentCategoryToDelete] =
    useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editDocumentCategory, setEditDocumentCategory] = useState(null);

  const columns = [
    { field: "name", headerName: "Category Name", width: 200 },
    {
      field: "remarks",
      headerName: "Remarks",
      width: 300,
      renderCell: (params) => params.value || "-",
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit document category"
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
          aria-label="Delete document category"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditDocumentCategory(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (documentCategory) => {
    setEditDocumentCategory(documentCategory);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditDocumentCategory(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditDocumentCategory(null);
    fetchDocumentCategories(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, documentCategory) => {
    setAnchorEl(event.currentTarget);
    setDocumentCategoryToDelete(documentCategory);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setDocumentCategoryToDelete(null);
  };

  const handleDeleteDocumentCategory = async () => {
    if (!documentCategoryToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/document-category/delete/${documentCategoryToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete document category"
        );
      }

      const data = await response.json();
      toast.success(data.message || "Document category deleted successfully!", {
        position: "top-right",
      });

      await fetchDocumentCategories(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete document category:", error);
      setFetchError(
        error.message || "Failed to delete document category. Please try again."
      );
      toast.error(error.message || "Failed to delete document category.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentCategories = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/document-category/list?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch document categories");
      }

      const data = await response.json();
      const documentCategories = (data.data?.documentCategories || [])
        .filter(
          (category) => category && typeof category === "object" && category.id
        )
        .map((category) => ({
          ...category,
          name: category.name || "-",
          remarks: category.remarks || "",
        }));

      if (documentCategories.length !== data.data?.documentCategories?.length) {
        console.warn(
          "Filtered out invalid document category entries:",
          data.data?.documentCategories
        );
      }

      setDocumentCategories(documentCategories);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch document categories:", error);
      setFetchError("Failed to load document categories. Please try again.");
      setDocumentCategories([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentCategories(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No document categories found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Document Categories ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Document Category</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Document Categories"
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
              rows={documentCategories}
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
                  showrowsperpage: false.toString(),
                },
              }}
            />
          </Paper>
        </>
      )}

      <DocumentCategoryFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        documentCategory={editDocumentCategory}
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
            <strong>{documentCategoryToDelete?.name}</strong>?
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
              onClick={handleDeleteDocumentCategory}
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

export default DocumentCategories;
