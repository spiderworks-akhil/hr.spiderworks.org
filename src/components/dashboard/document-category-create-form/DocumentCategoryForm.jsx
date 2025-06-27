"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Slide,
} from "@mui/material";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

const validationSchema = yup.object().shape({
  name: yup.string().required("Category name is required").trim(),
  remarks: yup.string().optional().trim(),
});

const DocumentCategoryFormPopup = ({
  open,
  onClose,
  onSuccess,
  documentCategory,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      remarks: "",
    },
    resolver: yupResolver(validationSchema),
  });

  useEffect(() => {
    if (!open) {
      reset({ name: "", remarks: "" });
      return;
    }

    if (documentCategory) {
      reset({
        name: documentCategory.name || "",
        remarks: documentCategory.remarks || "",
      });
    } else {
      reset({ name: "", remarks: "" });
    }
  }, [documentCategory, open, reset]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        remarks: formData.remarks ? formData.remarks.trim() : null,
      };

      const method = documentCategory ? "PUT" : "POST";
      const url = documentCategory
        ? `${BASE_URL}/api/document-category/update/${documentCategory.id}`
        : `${BASE_URL}/api/document-category/create`;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${
              documentCategory ? "update" : "create"
            } document category`
        );
      }

      const data = await response.json();
      toast.success(
        data.message ||
          `Document category ${
            documentCategory ? "updated" : "created"
          } successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(
        `Error ${
          documentCategory ? "updating" : "creating"
        } document category:`,
        err
      );
      setError(
        err.message ||
          `Failed to ${
            documentCategory ? "update" : "create"
          } document category. Please try again.`
      );
      toast.error(
        err.message ||
          `Failed to ${
            documentCategory ? "update" : "create"
          } document category.`,
        {
          position: "top-right",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      transitionDuration={500}
      TransitionProps={{ direction: "up" }}
      sx={{
        "& .MuiDialog-paper": {
          margin: 0,
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "38%",
          maxWidth: "none",
          height: "100%",
          borderRadius: 0,
          maxHeight: "100%",
        },
      }}
    >
      <DialogTitle>
        {documentCategory ? "Edit Document Category" : "Add Document Category"}
      </DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Category Name
            </label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{ style: { height: "40px" } }}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Remarks
            </label>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{ style: { height: "40px" } }}
                  error={!!errors.remarks}
                  helperText={errors.remarks?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            backgroundColor: "#ffebee",
            color: "#ef5350",
            "&:hover": { backgroundColor: "#ffcdd2" },
            padding: "8px 16px",
            borderRadius: "8px",
          }}
          disabled={loading}
        >
          Close
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          sx={{
            backgroundColor: "rgb(42,196,171)",
            color: "white",
            "&:hover": { backgroundColor: "rgb(36,170,148)" },
            padding: "8px 16px",
            borderRadius: "8px",
          }}
          disabled={loading}
        >
          {loading ? (
            <BeatLoader color="#fff" size={8} />
          ) : documentCategory ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentCategoryFormPopup;
