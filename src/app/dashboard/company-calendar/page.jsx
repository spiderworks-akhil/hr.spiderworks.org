"use client";

import React, { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import { DataGrid } from "@mui/x-data-grid";
import {
  Button,
  Popover,
  Typography,
  Box,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
import toast, { Toaster } from "react-hot-toast";
import dynamic from "next/dynamic";
import Select from "react-select";
import { BASE_URL } from "@/services/baseUrl";

const CompanyCalendarFormPopup = dynamic(
  () =>
    import(
      "@/components/dashboard/company-calendar-form/CompanyCalendarFormPopup"
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

const monthOptions = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const CompanyCalendar = () => {
  const [companyCalendars, setCompanyCalendars] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(3);
  const [isHoliday, setIsHoliday] = useState(null);
  const [month, setMonth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [calendarToDelete, setCalendarToDelete] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editCalendar, setEditCalendar] = useState(null);

  const columns = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      renderCell: (params) => (
        <span>
          {params.value ? moment(params.value).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      field: "is_holiday",
      headerName: "Holiday",
      width: 100,
      renderCell: (params) => <span>{params.value === 1 ? "Yes" : "No"}</span>,
    },
    {
      field: "remarks",
      headerName: "Remarks",
      width: 200,
      renderCell: (params) => <span>{params.value || "-"}</span>,
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 150,
      renderCell: (params) => <span>{params.value?.name || "-"}</span>,
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 150,
      renderCell: (params) => <span>{params.value?.name || "-"}</span>,
    },
    {
      field: "edit",
      headerName: "Edit",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleOpenEditDialog(params.row)}
          aria-label="Edit company calendar"
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
          aria-label="Delete company calendar"
          className="p-1"
        >
          <MdDelete className="w-5 h-5 text-red-500" />
        </button>
      ),
    },
  ];

  const handleOpenAddDialog = () => {
    setEditCalendar(null);
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (calendar) => {
    setEditCalendar(calendar);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditCalendar(null);
  };

  const handleOpenDeletePopover = (event, calendar) => {
    setAnchorEl(event.currentTarget);
    setCalendarToDelete(calendar);
  };

  const handleCloseDeletePopover = () => {
    setAnchorEl(null);
    setCalendarToDelete(null);
  };

  const handleDeleteCalendar = async () => {
    if (!calendarToDelete) return;
    handleCloseDeletePopover();
    try {
      setLoading(true);
      setFetchError(null);

      const response = await fetch(
        `${BASE_URL}/api/company-calendar/delete/${calendarToDelete.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to delete company calendar"
        );
      }

      const data = await response.json();
      toast.success(data.message || "Company calendar deleted successfully!", {
        position: "top-right",
      });

      await fetchCompanyCalendars();
    } catch (error) {
      console.error("Failed to delete company calendar:", error);
      setFetchError(
        error.message || "Failed to delete company calendar. Please try again."
      );
      toast.error(error.message || "Failed to delete company calendar.", {
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyCalendars = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const query = new URLSearchParams({
        page: (page + 1).toString(),
        limit: limit.toString(),
        ...(isHoliday !== null &&
          isHoliday !== "" && { isHoliday: isHoliday.toString() }),
        ...(month && { month: month.toString() }),
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/company-calendar/list?${query}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch company calendars");
      }

      const data = await response.json();
      const records = (data.data?.companyCalendars || [])
        .filter((record) => {
          if (!record || typeof record !== "object" || !record.id) {
            console.warn("Invalid company calendar entry:", record);
            return false;
          }
          return true;
        })
        .map((record) => ({
          ...record,
          date: record.date || null,
          is_holiday: record.is_holiday ?? null,
          remarks: record.remarks || null,
          createdBy: record.createdBy || null,
          updatedBy: record.updatedBy || null,
        }));

      setCompanyCalendars(records);
      setTotal(data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch company calendars:", error);
      setFetchError("Failed to load company calendars. Please try again.");
      setCompanyCalendars([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyCalendars();
  }, [page, isHoliday, month]);

  const handleFilterChange = (field, value) => {
    setPage(0);
    if (field === "isHoliday") {
      setIsHoliday(value === "" ? null : parseInt(value));
    } else if (field === "month") {
      setMonth(value);
    }
  };

  const handleSuccess = () => {
    setOpenDialog(false);
    setEditCalendar(null);
    fetchCompanyCalendars();
  };

  const CustomNoRowsOverlay = () => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>
      No company calendar entries found
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <div className="min-h-screen bg-white p-4">
        <Toaster position="top-right" reverseOrder={false} />
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold text-gray-800">
            Company Calendar ({total})
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
            + Add Calendar Entry
          </Button>
        </div>

        <Box display="flex" flexWrap="wrap" gap={2} mb={4}>
          <Box width={{ xs: "100%", sm: "150px" }}>
            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                className="text-sm font-medium mb-1"
              >
                Holiday
              </FormLabel>
              <RadioGroup
                row
                value={isHoliday !== null ? isHoliday.toString() : ""}
                onChange={(e) =>
                  handleFilterChange("isHoliday", e.target.value)
                }
              >
                <FormControlLabel
                  value=""
                  control={<Radio size="small" />}
                  label="All"
                />
                <FormControlLabel
                  value="1"
                  control={<Radio size="small" />}
                  label="Yes"
                />
                <FormControlLabel
                  value="0"
                  control={<Radio size="small" />}
                  label="No"
                />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box width={{ xs: "100%", sm: "200px" }}>
            <label className="block mb-1 text-sm font-medium">Month</label>
            <Select
              options={monthOptions}
              value={monthOptions.find((opt) => opt.value === month) || null}
              onChange={(selected) =>
                handleFilterChange("month", selected ? selected.value : null)
              }
              styles={customSelectStyles}
              placeholder="Select Month..."
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
              rows={companyCalendars}
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

        <CompanyCalendarFormPopup
          open={openDialog}
          onClose={handleCloseDialog}
          onSuccess={handleSuccess}
          calendar={editCalendar}
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
              Are you sure you want to delete calendar entry for{" "}
              <strong className="fontRecursive">
                {calendarToDelete?.date
                  ? moment(calendarToDelete.date).format("DD-MM-YYYY")
                  : "this date"}
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
                onClick={handleDeleteCalendar}
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

export default CompanyCalendar;
