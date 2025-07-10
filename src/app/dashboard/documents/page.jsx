"use client";

import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { AiOutlineEye } from "react-icons/ai";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Popover, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BASE_URL } from "@/services/baseUrl";

// Dynamically import DocumentFormPopup with SSR disabled
const DocumentFormPopup = dynamic(
  () => import("@/components/dashboard/document-create-form/DocumentFormPopup"),
  { ssr: false }
);

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editDocument, setEditDocument] = useState(null);

  const columns = [
    { field: "name", headerName: "Document Name", width: 200 },
    {
      field: "document",
      headerName: "Document",
      width: 200,
      renderCell: (params) => {
        if (!params.value) return "-";
        // Extract file name (e.g., "dummy.pdf")
        const fileName = params.value.split("/").pop().split("_").pop();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>{fileName}</span>
            <Link
              href={`${BASE_URL}/${params.value}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span
                style={{ display: "inline-flex", transition: "opacity 0.2s" }}
                className="hover:opacity-80 mt-4"
              >
                <AiOutlineEye
                  style={{
                    color: "rgb(42,196,171)",
                    cursor: "pointer",
                    fontSize: "20px",
                  }}
                />
              </span>
            </Link>
          </div>
        );
      },
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      renderCell: (params) => (
        <>
          {params.row.category?.name && params.row.category.name.trim() !== ""
            ? params.row.category.name
            : "-"}
        </>
      ),
    },
    { field: "status", headerName: "Status", width: 100 },
    { field: "permission", headerName: "Permission", width: 100 },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit document"
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
          aria-label="Delete document"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditDocument(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (document) => {
    setEditDocument(document);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditDocument(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditDocument(null);
    fetchDocuments(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, document) => {
    setAnchorEl(event.currentTarget);
    setDocumentToDelete(document);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setDocumentToDelete(null);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/documents/delete/${documentToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete document");
      }

      const data = await response.json();
      toast.success(data.message || "Document deleted successfully!", {
        position: "top-right",
      });

      await fetchDocuments(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete document:", error);
      setFetchError(
        error.message || "Failed to delete document. Please try again."
      );
      toast.error(error.message || "Failed to delete document.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(`${BASE_URL}/api/documents/list?${query}`);
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      const documents = (data.data?.documents || [])
        .filter((doc) => {
          if (!doc || typeof doc !== "object" || !doc.id) {
            console.warn("Invalid document entry:", doc);
            return false;
          }
          return true;
        })
        .map((doc) => ({
          ...doc,
          status: doc.status?.toString() || "-",
          remarks: doc.remarks || "-",
          permission: doc.permission || "PUBLIC",
          category: doc.category || null,
          grantedAccess: doc.grantedAccess || [],
        }));

      setDocuments(documents);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setFetchError("Failed to load documents. Please try again.");
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No documents found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Documents ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Document</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Documents"
          value={searchQuery}
          onChange={handleSearchChange}
          className="border border-gray-300 rounded-md px-3 py-2 w-full md:w-1/4 focus:outline-none focus:ring-1 focus:ring-[rgb(42,196,171)]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <BeatLoader color="#2ac4ab" size={15} />
        </div>
      ) : fetchError ? (
        <div className="text-center text-red-600 py-10">{fetchError}</div>
      ) : (
        <>
          <Paper sx={{ width: "100%", boxShadow: "none" }}>
            <DataGrid
              rows={documents}
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

      <DocumentFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        document={editDocument}
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
            <strong>{documentToDelete?.name}</strong>?
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
              onClick={handleDeleteDocument}
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

export default Documents;
