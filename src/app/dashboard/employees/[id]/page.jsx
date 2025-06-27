"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MdPerson } from "react-icons/md";
import { BeatLoader } from "react-spinners";
import Details from "@/components/dashboard/employee-details/Details";
import Documents from "@/components/dashboard/employee-details/Documents";
import EmployeeSkillHobbies from "@/components/dashboard/employee-details/SkillsHobbies";
import EmployeeEmergencyContacts from "@/components/dashboard/employee-details/EmergencyContacts";
import EmployeePhotos from "@/components/dashboard/employee-details/Photos";
import EmployeeNotes from "@/components/dashboard/employee-details/Notes";
import EmployeeSalaryRevision from "@/components/dashboard/employee-details/Salary";
import { BASE_URL } from "@/services/baseUrl";

const EmployeeDetails = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${BASE_URL}/api/employees/view/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch employee details");
        }
        const data = await response.json();
        if (!data.data || !data.data.employee) {
          throw new Error("Employee not found");
        }
        setEmployee(data.data.employee);
      } catch (error) {
        console.error("Failed to fetch employee details:", error);
        setError(
          error.message || "Failed to load employee details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  const renderContent = () => {
    if (!employee) return null;
    switch (activeTab) {
      case "details":
        return <Details employee={employee} />;
      case "salary":
        return <EmployeeSalaryRevision employee={employee} />;
      case "documents":
        return <Documents employee={employee} />;
      case "skills-and-hobbies":
        return <EmployeeSkillHobbies employee={employee} />;
      case "emergency-contacts":
        return <EmployeeEmergencyContacts employee={employee} />;
      case "photos":
        return <EmployeePhotos employee={employee} />;
      case "notes":
        return <EmployeeNotes employee={employee} />;
      default:
        return <Details employee={employee} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <BeatLoader color="#2ac4ab" height={50} width={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-gray-600">Employee not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-fit bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <MdPerson className="w-8 h-8 text-gray-600" />
          <h1 className="text-2xl font-semibold text-gray-800">
            {employee.name || "Employee"}
          </h1>
        </div>
        <Link
          href="/dashboard/employees"
          className="bg-[rgb(42,196,171)] text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <span>Back to Employees</span>
        </Link>
      </div>

      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("details")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "details"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Details
        </button>
        <button
          onClick={() => setActiveTab("salary")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "salary"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Salary
        </button>
        <button
          onClick={() => setActiveTab("documents")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "documents"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveTab("skills-and-hobbies")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "skills-and-hobbies"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Skills and Hobbies
        </button>
        <button
          onClick={() => setActiveTab("emergency-contacts")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "emergency-contacts"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Emergency Contacts
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "photos"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Photos
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`pb-2 px-4 text-sm font-medium ${
            activeTab === "notes"
              ? "text-[rgb(42,196,171)] border-b-2 border-[rgb(42,196,171)]"
              : "text-gray-600 hover:text-[rgb(42,196,171)]"
          }`}
        >
          Notes
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default EmployeeDetails;
