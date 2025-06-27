"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { BeatLoader } from "react-spinners";
import { Typography, Box } from "@mui/material";
import Link from "next/link";
import { MdAssignment } from "react-icons/md";
import Parameters from "@/components/dashboard/employee-evaluation-template-details/Parameters";
import Staffs from "@/components/dashboard/employee-evaluation-template-details/Staffs";
import { BASE_URL } from "@/services/baseUrl";

const EmployeeEvaluationTemplateDetails = () => {
  const router = useRouter();
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("parameters");

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `${BASE_URL}/api/employee-evaluation-templates/view/${id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch template");
        }
        const data = await response.json();
        const templateData = data.data?.template;
        if (!templateData) {
          throw new Error("Template not found");
        }
        setTemplate(templateData);
      } catch (error) {
        console.error("Failed to fetch template:", error);
        setError(error.message || "Failed to load template. Please try again.");
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    } else {
      setLoading(false);
      setError("Invalid template ID.");
    }
  }, [id]);

  const renderContent = () => {
    if (!template) return null;
    switch (activeTab) {
      case "parameters":
        return <Parameters template={template} />;
      case "staffs":
        return <Staffs template={template} />;
      default:
        return <Parameters template={template} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <BeatLoader color="#2ac4ab" size={15} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Typography className="text-red-600">{error}</Typography>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Typography className="text-gray-600">Template not found.</Typography>
      </div>
    );
  }

  return (
    <div className="min-h-fit bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <MdAssignment className="w-8 h-8 text-gray-600" />
          <Typography variant="h5" className="text-gray-800 font-semibold">
            Template: {template.name}
          </Typography>
        </div>
        <Link
          href="/dashboard/employee-evaluation-template"
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>Back to Templates</span>
        </Link>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("parameters")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "parameters"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Parameters
        </button>
        <button
          onClick={() => setActiveTab("staffs")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "staffs"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Staffs
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default EmployeeEvaluationTemplateDetails;
