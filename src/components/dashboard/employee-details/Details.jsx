"use client";

import React from "react";
import moment from "moment";

const Details = ({ employee }) => {
  if (!employee) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-gray-600 text-center">
        No employee data available
      </div>
    );
  }

  return (
    <div className="bg-white p-4">
      {/* Basic Information */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Basic Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Name:</p>
          <p className="text-base text-gray-800">
            {employee.name || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Personal Email:</p>
          <p className="text-base text-gray-800">
            {employee.personal_email || "Not Available"}
          </p>
        </div>
      </div>

      {/* Contact Details */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Contact Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Work Email:</p>
          <p className="text-base text-gray-800">
            {employee.work_email || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Personal Phone:</p>
          <p className="text-base text-gray-800">
            {employee.personal_phone || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Office Phone:</p>
          <p className="text-base text-gray-800">
            {employee.office_phone || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Address:</p>
          <p className="text-base text-gray-800">
            {employee.address || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Reporting Email:
          </p>
          <p className="text-base text-gray-800">
            {employee.reporting_email || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Leave Notification Emails:
          </p>
          <p className="text-base text-gray-800">
            {employee.leave_notification_mails || "Not Available"}
          </p>
        </div>
      </div>

      {/* Personal Dates */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Personal Dates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Official Date of Birth:
          </p>
          <p className="text-base text-gray-800">
            {employee.official_date_of_birth
              ? moment(employee.official_date_of_birth).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Celebrated Date of Birth:
          </p>
          <p className="text-base text-gray-800">
            {employee.celebrated_date_of_birth
              ? moment(employee.celebrated_date_of_birth).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Marriage Date:</p>
          <p className="text-base text-gray-800">
            {employee.marriage_date
              ? moment(employee.marriage_date).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
      </div>

      {/* Employment Details */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Employment Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Joining Date:</p>
          <p className="text-base text-gray-800">
            {employee.joining_date
              ? moment(employee.joining_date).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Releaving Date:</p>
          <p className="text-base text-gray-800">
            {employee.releaving_date
              ? moment(employee.releaving_date).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Employee Level:</p>
          <p className="text-base text-gray-800">
            {employee.employee_level || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Employee Type:</p>
          <p className="text-base text-gray-800">
            {employee.employee_type || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Department:</p>
          <p className="text-base text-gray-800">
            {employee.Department?.name || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Role:</p>
          <p className="text-base text-gray-800">
            {employee.Role?.name || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Manager Name:</p>
          <p className="text-base text-gray-800">
            {employee.manager?.name || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Additional Managers:
          </p>
          <p className="text-base text-gray-800">
            {employee.additionalManagers &&
            employee.additionalManagers.length > 0
              ? employee.additionalManagers.map((mgr) => mgr.name).join(", ")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Remarks:</p>
          <p className="text-base text-gray-800">
            {employee.remarks || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Last Sign In Email:
          </p>
          <p className="text-base text-gray-800">
            {employee.last_sign_in_email
              ? moment(employee.last_sign_in_email).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Last Sign Out Email:
          </p>
          <p className="text-base text-gray-800">
            {employee.last_sign_out_email
              ? moment(employee.last_sign_out_email).format("DD-MM-YYYY")
              : "Not Available"}
          </p>
        </div>
      </div>

      {/* Portal Access */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Portal Access
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Sign-In Mandatory:
          </p>
          <p className="text-base text-gray-800">
            {employee.is_signin_mandatory ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Work Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_work_portal_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            HR Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_hr_portal_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Client Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_client_portal_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Inventory Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_inventory_portal_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Super Admin Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_super_admin_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Accounts Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_accounts_portal_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Admin Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_admin_portal_access ? "Yes" : "No"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">
            Showcase Portal Access:
          </p>
          <p className="text-base text-gray-800">
            {employee.has_showcase_portal_access ? "Yes" : "No"}
          </p>
        </div>
      </div>

      {/* Social Media Links */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Social Media Links
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Facebook URL:</p>
          <p className="text-base text-gray-800">
            {employee.facebook_url || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Instagram URL:</p>
          <p className="text-base text-gray-800">
            {employee.instagram_url || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">LinkedIn URL:</p>
          <p className="text-base text-gray-800">
            {employee.linkedin_url || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Blog URL:</p>
          <p className="text-base text-gray-800">
            {employee.blog_url || "Not Available"}
          </p>
        </div>
      </div>

      {/* Photos */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Photos
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Selfie Photo:</p>
          <p className="text-base text-gray-800">
            {employee.selfi_photo || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Family Photo:</p>
          <p className="text-base text-gray-800">
            {employee.family_photo || "Not Available"}
          </p>
        </div>
      </div>

      {/* Metadata */}
      <hr className="my-6 border-gray-200" />
      <h3 className="text-lg font-semibold text-gray-700 mb-4 col-span-2">
        Metadata
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Created At:</p>
          <p className="text-base text-gray-800">
            {employee.created_at
              ? moment(employee.created_at).format("DD-MM-YYYY HH:mm:ss")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Updated At:</p>
          <p className="text-base text-gray-800">
            {employee.updated_at
              ? moment(employee.updated_at).format("DD-MM-YYYY HH:mm:ss")
              : "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Created By:</p>
          <p className="text-base text-gray-800">
            {employee.created_by || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">Updated By:</p>
          <p className="text-base text-gray-800">
            {employee.updated_by || "Not Available"}
          </p>
        </div>
        <div className="pb-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <p className="text-sm text-gray-600 font-semibold">User ID:</p>
          <p className="text-base text-gray-800">
            {employee.user_id || "Not Available"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Details;
