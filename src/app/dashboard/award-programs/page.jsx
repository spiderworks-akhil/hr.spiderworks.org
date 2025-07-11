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
import moment from "moment";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import { BASE_URL } from "@/services/baseUrl";

// Dynamically import AwardProgramFormPopup with SSR disabled
const AwardProgramFormPopup = dynamic(
  () =>
    import("@/components/dashboard/award-program-form/AwardProgramFormPopup"),
  { ssr: false }
);

const AwardPrograms = () => {
  const [awardPrograms, setAwardPrograms] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [awardProgramToDelete, setAwardProgramToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editAwardProgram, setEditAwardProgram] = useState(null);

  const columns = [
    { field: "title", headerName: "Title", width: 200 },
    {
      field: "description",
      headerName: "Description",
      width: 250,
      renderCell: (params) => (
        <>
          {params.row.description && params.row.description.trim() !== ""
            ? params.row.description
            : "-"}
        </>
      ),
    },
    {
      field: "expiry_date",
      headerName: "Expiry Date",
      width: 150,
      renderCell: (params) => (
        <>{params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}</>
      ),
    },
    {
      field: "thumbnail",
      headerName: "Thumbnail",
      width: 150,
      renderCell: (params) => {
        if (!params.value) return "-";

        const fileNameParts = params.value.split("_");
        const displayName =
          fileNameParts.length > 1
            ? fileNameParts[1]
            : fileNameParts[0].split("/").pop();
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              height: "100%",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            <Typography
              sx={{
                flexShrink: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "120px",
              }}
            >
              {displayName}
            </Typography>
            <PhotoProvider bannerVisible={false} maskOpacity={0.5}>
              <PhotoView src={`${BASE_URL}/${params.value}`}>
                <img
                  src={`${BASE_URL}/${params.value}`}
                  alt="Award Program Thumbnail"
                  style={{
                    width: "100px",
                    height: "auto",
                    maxHeight: "50px",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
              </PhotoView>
            </PhotoProvider>
          </Box>
        );
      },
    },
    {
      field: "is_active",
      headerName: "Active",
      width: 100,
      valueGetter: (params) => (params?.row?.is_active ? "Yes" : "No"),
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit award program"
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
          aria-label="Delete award program"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditAwardProgram(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (awardProgram) => {
    setEditAwardProgram(awardProgram);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditAwardProgram(null);
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditAwardProgram(null);
    fetchAwardPrograms(page, searchQuery);
  };

  const handleOpenDeletePopover = (event, awardProgram) => {
    setAnchorEl(event.currentTarget);
    setAwardProgramToDelete(awardProgram);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setAwardProgramToDelete(null);
  };

  const handleDeleteAwardProgram = async () => {
    if (!awardProgramToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/award-programs/delete/${awardProgramToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete award program");
      }

      const data = await response.json();
      toast.success(data.message || "Award program deleted successfully!", {
        position: "top-right",
      });

      await fetchAwardPrograms(page, searchQuery);
    } catch (error) {
      console.error("Failed to delete award program:", error);
      setFetchError(
        error.message || "Failed to delete award program. Please try again."
      );
      toast.error(error.message || "Failed to delete award program.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAwardPrograms = async (pageNum, search = "") => {
    try {
      setLoading(true);
      setFetchError(null);
      const query = new URLSearchParams({
        page: (pageNum + 1).toString(),
        limit: limit.toString(),
        keyword: search,
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/award-programs/list?${query}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch award programs");
      }

      const data = await response.json();
      const awardPrograms = (data.data?.awardPrograms || [])
        .filter((program) => {
          if (!program || typeof program !== "object" || !program.id) {
            console.warn("Invalid award program entry:", program);
            return false;
          }
          return true;
        })
        .map((program) => ({
          ...program,
          description: program.description || null,
          expiry_date: program.expiry_date || null,
          thumbnail: program.thumbnail || null,
          is_active: program.is_active === 1,
        }));

      setAwardPrograms(awardPrograms);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch award programs:", error);
      setFetchError("Failed to load award programs. Please try again.");
      setAwardPrograms([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAwardPrograms(page, searchQuery);
  }, [page, searchQuery]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(0);
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No award programs found
    </Box>
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">
          Award Programs ({total})
        </h1>
        <button
          onClick={handleOpenAddDialog}
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>+ Add Award Program</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search Award Programs"
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
              rows={awardPrograms}
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

      <AwardProgramFormPopup
        open={openDialog}
        onClose={handleCloseDialog}
        onSuccess={handleSuccess}
        awardProgram={editAwardProgram}
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
            <strong>{awardProgramToDelete?.title}</strong>?
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
              onClick={handleDeleteAwardProgram}
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

export default AwardPrograms;
