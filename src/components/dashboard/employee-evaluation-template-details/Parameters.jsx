"use client";

import { useState, useEffect } from "react";
import { Checkbox, Typography, Box, Paper } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { BASE_URL } from "@/services/baseUrl";

const Parameters = ({ template }) => {
  const [allParameters, setAllParameters] = useState([]);
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchParameters = async () => {
    try {
      setFetchError(null);

      const paramsResponse = await fetch(
        `${BASE_URL}/api/employee-rating-parameter/list`
      );
      if (!paramsResponse.ok) {
        throw new Error("Failed to fetch parameters");
      }
      const paramsData = await paramsResponse.json();
      const allParams =
        paramsData.data?.employeeRatingParameters?.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
        })) || [];

      const templateResponse = await fetch(
        `${BASE_URL}/api/employee-evaluation-templates/view/${template.id}`
      );
      if (!templateResponse.ok) {
        throw new Error("Failed to fetch template");
      }
      const templateData = await templateResponse.json();
      const selectedParams =
        templateData.data?.template?.parameterMapping?.map((p) => ({
          id: p.parameter.id,
          name: p.parameter.name,
          description: p.parameter.description,
        })) || [];

      setAllParameters([...allParams]);
      setSelectedParameters([...selectedParams]);
    } catch (error) {
      console.error("Failed to fetch parameters:", error);
      setFetchError(
        error.message || "Failed to load parameters. Please try again."
      );
      setAllParameters([]);
      setSelectedParameters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, [template.id]);

  const handleSelectParameter = async (parameter) => {
    setUpdating(true);

    const newSelectedParameters = [
      ...selectedParameters,
      {
        id: parameter.id,
        name: parameter.name,
        description: parameter.description,
      },
    ];
    setSelectedParameters(newSelectedParameters);

    try {
      const response = await fetch(
        `${BASE_URL}/api/employee-evaluation-templates/${template.id}/parameters/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parameters: [{ parameter_id: parameter.id }],
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to select parameter");
      }
      const data = await response.json();
      toast.success(data.message || "Parameter selected successfully!", {
        position: "top-right",
      });

      await fetchParameters();
    } catch (error) {
      console.error("Failed to select parameter:", error);
      toast.error(error.message || "Failed to select parameter.", {
        position: "top-right",
      });

      setSelectedParameters(selectedParameters);
      await fetchParameters();
    } finally {
      setUpdating(false);
    }
  };

  const handleUnselectParameter = async (parameter) => {
    setUpdating(true);

    const newSelectedParameters = selectedParameters.filter(
      (p) => p.id !== parameter.id
    );
    setSelectedParameters(newSelectedParameters);

    try {
      const response = await fetch(
        `${BASE_URL}/api/employee-evaluation-templates/${template.id}/parameters/unselect`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parameters: [{ parameter_id: parameter.id }],
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unselect parameter");
      }
      const data = await response.json();
      toast.success(data.message || "Parameter unselected successfully!", {
        position: "top-right",
      });

      await fetchParameters();
    } catch (error) {
      console.error("Failed to unselect parameter:", error);
      toast.error(error.message || "Failed to unselect parameter.", {
        position: "top-right",
      });

      setSelectedParameters(selectedParameters);
      await fetchParameters();
    } finally {
      setUpdating(false);
    }
  };

  const availableParameters = allParameters.filter(
    (param) => !selectedParameters.some((sel) => sel.id === param.id)
  );

  const CustomNoParametersOverlay = ({ message }) => (
    <Box sx={{ p: 2, textAlign: "center", color: "gray" }}>{message}</Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <BeatLoader color="#2ac4ab" size={12} />
      </Box>
    );
  }

  if (fetchError) {
    return (
      <Typography color="error" sx={{ mb: 2 }}>
        {fetchError}
      </Typography>
    );
  }

  return (
    <div className="p-6">
      <Toaster position="top-right" reverseOrder={true} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Paper
          elevation={0}
          className="p-6 border-r border-gray-200 transition-shadow duration-200"
        >
          <Typography variant="h6" className="text-gray-800 mb-4 font-medium">
            Selected Parameters
          </Typography>
          {selectedParameters.length === 0 ? (
            <CustomNoParametersOverlay message="No parameters selected." />
          ) : (
            <div className="space-y-3">
              {selectedParameters.map((param) => (
                <div
                  key={param.id}
                  className="flex items-center justify-between border-b border-gray-200 py-3 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div>
                    <Typography variant="body1" className="text-gray-800">
                      {param.name}
                    </Typography>
                  </div>
                  <Checkbox
                    checked={true}
                    onChange={() => handleUnselectParameter(param)}
                    disabled={updating}
                    sx={{
                      color: "#2ac4ab",
                      "&.Mui-checked": { color: "#2ac4ab" },
                      "&:hover": { backgroundColor: "rgba(42,196,171,0.1)" },
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Paper>

        <Paper
          elevation={0}
          className="p-6 rounded-lg transition-shadow duration-200"
        >
          <Typography variant="h6" className="text-gray-800 mb-4 font-medium">
            Available Parameters
          </Typography>
          {availableParameters.length === 0 ? (
            <CustomNoParametersOverlay message="No available parameters." />
          ) : (
            <div className="space-y-3">
              {availableParameters.map((param) => (
                <div
                  key={param.id}
                  className="flex items-center justify-between border-b border-gray-200 py-3 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div>
                    <Typography variant="body1" className="text-gray-800">
                      {param.name}
                    </Typography>
                  </div>
                  <Checkbox
                    checked={false}
                    onChange={() => handleSelectParameter(param)}
                    disabled={updating}
                    sx={{
                      color: "#2ac4ab",
                      "&.Mui-checked": { color: "#2ac4ab" },
                      "&:hover": { backgroundColor: "rgba(42,196,171,0.1)" },
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Paper>
      </div>
    </div>
  );
};

export default Parameters;
