"use client";

import { useState, useEffect, useRef } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import Select from "react-select";
import { BeatLoader } from "react-spinners";
import toast from "react-hot-toast";
import { useQuill } from "react-quilljs";
import "quill/dist/quill.snow.css";
import { BASE_URL } from "@/services/baseUrl";

const Transition = Slide;

const customSelectStyles = {
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
};

const validationSchema = yup.object().shape({
  name: yup.string().required("Document name is required").trim(),
  document_category_id: yup.number().nullable(),
  status: yup.string().nullable().trim(),
  content: yup.string().nullable(),
  remarks: yup.string().nullable().trim(),
  permission: yup
    .string()
    .oneOf(["PUBLIC", "PRIVATE"], "Invalid permission")
    .required("Permission is required"),
  grantedAccess: yup.array().of(yup.number()).nullable(),
  document: yup
    .mixed()
    .nullable()
    .test("fileSize", "File size must not exceed 5 MB", (value) => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test("fileType", "Unsupported file type", (value) => {
      if (!value) return true;
      return [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(value.type);
    }),
});

const DocumentFormPopup = ({ open, onClose, onSuccess, document: doc }) => {
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const { quill, quillRef } = useQuill({
    theme: "snow",
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "image", "code-block"],
        ["clean"],
      ],
    },
    formats: [
      "header",
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "align",
      "link",
      "image",
      "code-block",
      "color",
      "background",
    ],
    placeholder: "Write your content here...",
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      name: "",
      document_category_id: null,
      status: "",
      document: null,
      content: "",
      remarks: "",
      permission: "PUBLIC",
      grantedAccess: [],
    },
    resolver: yupResolver(validationSchema),
  });

  const imageHandler = () => {
    if (!quill) {
      return;
    }

    const input = window.document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/jpeg,image/png,image/gif");
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          setImageError("Image size must not exceed 5 MB.");
          setTimeout(() => setImageError(null), 2000);
          return;
        }

        try {
          const formData = new FormData();
          formData.append("image", file);

          const response = await fetch(
            `${BASE_URL}/api/documents/upload-image`,
            {
              method: "POST",
              body: formData,
            }
          );
          if (!response.ok) {
            const errorData = await response.json();
            const errorMessage =
              errorData.data?.message || "Image upload failed";
            if (errorData.statusCode === 413) {
              setImageError("Image size must not exceed 5 MB.");
              setTimeout(() => setImageError(null), 2000);
            } else {
              throw new Error(errorMessage);
            }
            return;
          }
          const data = await response.json();
          const url = data.data?.url;
          const absoluteUrl = `${BASE_URL}/${url}`;

          const range = quill.getSelection(true) || {
            index: quill.getLength(),
          };
          quill.insertEmbed(range.index, "image", absoluteUrl);
          quill.setSelection(range.index + 1);

          setValue("content", quill.root.innerHTML, { shouldValidate: true });
          toast.success("Image uploaded successfully!");
        } catch (error) {
          setImageError(error.message || "Failed to upload image.");
          setTimeout(() => setImageError(null), 2000);
          toast.error(error.message || "Failed to upload image.");
        }
      }
    };
  };

  useEffect(() => {
    if (quill && open) {
      const toolbar = quill.getModule("toolbar");
      if (toolbar) {
        toolbar.addHandler("image", imageHandler);
        const imageButton = quill.container.querySelector(".ql-image");
        if (imageButton) {
          imageButton.addEventListener("click", () => {
            imageHandler();
          });
        } else {
          console.warn("Image button not found in toolbar");
        }
      } else {
        console.warn("Quill toolbar module not found");
      }
      quill.on("text-change", () => {
        const content = quill.root.innerHTML;

        setValue("content", content, { shouldValidate: true });
      });

      quill.setContents([{ insert: "" }]);
      quill.root.style.minHeight = "24rem";
      quill.root.style.height = "auto";

      return () => {
        const imageButton = quill.container.querySelector(".ql-image");
        if (imageButton) {
          imageButton.removeEventListener("click", imageHandler);
        }
      };
    }
  }, [quill, open, setValue]);

  useEffect(() => {
    if (open) {
      if (doc) {
        reset({
          name: doc.name || "",
          document_category_id: doc.document_category_id || null,
          status: doc.status || "",
          document: null,
          content: doc.content || "",
          remarks: doc.remarks || "",
          permission: doc.permission || "PUBLIC",
          grantedAccess: doc.grantedAccess?.map((emp) => emp.id) || [],
        });
        if (quill && doc.content) {
          quill.clipboard.dangerouslyPasteHTML(doc.content);
          setValue("content", doc.content, { shouldValidate: true });
        }
      } else {
        reset({
          name: "",
          document_category_id: null,
          status: "",
          document: null,
          content: "",
          remarks: "",
          permission: "PUBLIC",
          grantedAccess: [],
        });
        if (quill) {
          quill.setContents([]);
          setValue("content", "", { shouldValidate: true });
        }
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }

    return () => {
      if (!open) {
        reset({
          name: "",
          document_category_id: null,
          status: "",
          document: null,
          content: "",
          remarks: "",
          permission: "PUBLIC",
          grantedAccess: [],
        });
        if (quill) {
          quill.setContents([]);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
  }, [open, doc, reset, quill, setValue]);

  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/api/document-category/list`
          );
          if (!response.ok) throw new Error("Failed to fetch categories");
          const data = await response.json();
          setCategories(data?.data?.documentCategories || []);
        } catch (err) {
          setError("Failed to load categories.");
        }
      };

      const fetchEmployees = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/employees/list`);
          if (!response.ok) throw new Error("Failed to fetch employees");
          const data = await response.json();
          setEmployees(data?.data?.employees || []);
        } catch (err) {
          setError("Failed to load employees for grant access.");
        }
      };

      fetchCategories();
      fetchEmployees();
    }
  }, [open]);

  const onSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      const currentContent = quill ? quill.root.innerHTML : formData.content;

      const formDataPayload = new FormData();
      formDataPayload.append("name", formData.name.trim());
      if (formData.document_category_id) {
        formDataPayload.append(
          "document_category_id",
          formData.document_category_id
        );
      }
      if (formData.status) {
        formDataPayload.append("status", formData.status.trim());
      }
      if (formData.document) {
        formDataPayload.append("document", formData.document);
      }
      if (currentContent) {
        formDataPayload.append("content", currentContent);
      }
      if (formData.remarks) {
        formDataPayload.append("remarks", formData.remarks.trim());
      }
      formDataPayload.append("permission", formData.permission);
      if (formData.grantedAccess?.length) {
        formDataPayload.append(
          "grantedAccess",
          JSON.stringify(formData.grantedAccess)
        );
      }

      const method = doc ? "PUT" : "POST";
      const url = doc
        ? `${BASE_URL}/api/documents/update/${doc.id}`
        : `${BASE_URL}/api/documents/create`;

      const response = await fetch(url, {
        method,
        body: formDataPayload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to ${doc ? "update" : "create"} document`
        );
      }

      const data = await response.json();
      toast.success(
        data.message || `Document ${doc ? "updated" : "created"} successfully!`,
        {
          position: "top-right",
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.message ||
          `Failed to ${doc ? "update" : "create"} document. Please try again.`
      );
      toast.error(
        err.message || `Failed to ${doc ? "update" : "create"} document.`,
        {
          position: "top-right",
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: emp.name,
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
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
          width: "78%",
          maxWidth: "none",
          height: "100%",
          borderRadius: 0,
          maxHeight: "100%",
        },
      }}
    >
      <DialogTitle>{doc ? "Edit Document" : "Add Document"}</DialogTitle>
      <DialogContent>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Document Name
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
              Category
            </label>
            <Controller
              name="document_category_id"
              control={control}
              render={({ field }) => (
                <Select
                  options={categoryOptions}
                  value={
                    categoryOptions.find((opt) => opt.value === field.value) ||
                    null
                  }
                  onChange={(selected) =>
                    field.onChange(selected ? selected.value : null)
                  }
                  styles={customSelectStyles}
                  placeholder="Select category..."
                  isClearable
                  isSearchable
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Status
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  variant="outlined"
                  size="small"
                  InputProps={{ style: { height: "40px" } }}
                  error={!!errors.status}
                  helperText={errors.status?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Document Upload
            </label>
            <Controller
              name="document"
              control={control}
              render={({ field }) => (
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files[0] || null;
                    setValue("document", file, { shouldValidate: true });
                  }}
                  style={{ width: "100%", padding: "8px" }}
                />
              )}
            />
            {errors.document && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {errors.document?.message}
              </span>
            )}
            {doc?.document && (
              <span
                style={{ display: "block", marginTop: "8px", fontSize: "14px" }}
              >
                Existing document:{" "}
                {doc.document.split("/").pop().split("_").pop()}
              </span>
            )}
          </Grid>
          <Grid item xs={12}>
            <div className="flex gap-4 items-center">
              <label>Content</label>
              <span style={{ fontSize: "12px", color: "#666" }}>
                (File size: Up to 5MB)
              </span>
            </div>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <div className="border border-gray-300 rounded-md">
                  <div
                    ref={quillRef}
                    style={{ minHeight: "24rem", backgroundColor: "white" }}
                  />
                </div>
              )}
            />
            {errors.content && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {errors.content?.message}
              </span>
            )}
            {imageError && (
              <span
                style={{
                  color: "red",
                  fontSize: "12px",
                  display: "block",
                  marginTop: "4px",
                }}
              >
                {imageError}
              </span>
            )}
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
                  multiline
                  rows={4}
                  error={!!errors.remarks}
                  helperText={errors.remarks?.message}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Grant Access
            </label>
            <Controller
              name="grantedAccess"
              control={control}
              render={({ field }) => (
                <Select
                  isMulti
                  options={employeeOptions}
                  value={employeeOptions.filter((opt) =>
                    field.value?.includes(opt.value)
                  )}
                  onChange={(selected) =>
                    field.onChange(
                      selected ? selected.map((opt) => opt.value) : []
                    )
                  }
                  styles={customSelectStyles}
                  placeholder="Select employees..."
                  isClearable
                  isSearchable
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <label style={{ display: "block", marginBottom: "4px" }}>
              Permission
            </label>
            <Controller
              name="permission"
              control={control}
              render={({ field }) => (
                <ToggleButtonGroup
                  {...field}
                  value={field.value}
                  exclusive
                  onChange={(e, value) => {
                    if (value !== null) field.onChange(value);
                  }}
                  sx={{ mt: 1 }}
                >
                  <ToggleButton value="PUBLIC" sx={{ width: "50%" }}>
                    Public
                  </ToggleButton>
                  <ToggleButton value="PRIVATE" sx={{ width: "50%" }}>
                    Private
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            />
            {errors.permission && (
              <span style={{ color: "red", fontSize: "12px" }}>
                {errors.permission?.message}
              </span>
            )}
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
          Cancel
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
          ) : doc ? (
            "Update"
          ) : (
            "Submit"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentFormPopup;
