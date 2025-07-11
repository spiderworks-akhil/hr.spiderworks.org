"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiUsers,
  FiCalendar,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { LuUserCog } from "react-icons/lu";
import {
  FaLayerGroup,
  FaShieldAlt,
  FaStar,
  FaComments,
  FaAward,
  FaTrophy,
  FaFileAlt,
  FaBullseye,
  FaRegStar,
  FaClipboardList,
  FaCalendarAlt,
  FaRegFileAlt,
  FaBook,
  FaRegCalendarAlt,
  FaUsers,
  FaDatabase,
  FaClock,
  FaFolderOpen,
  FaUserPlus,
  FaFileSignature,
} from "react-icons/fa";
import { useState } from "react";
import { Popover } from "@mui/material";

export default function Sidebar({
  isOpen,
  isMobileOpen,
  isMobileView,
  closeMobileSidebar,
}) {
  const pathname = usePathname();
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState(false);
  const [isRecruitmentsOpen, setIsRecruitmentsOpen] = useState(false);

  const navItems = [
    {
      icon: <FaUsers className="w-6 h-6 flex-shrink-0" />,
      label: "Users",
      path: "/dashboard/users",
      exact: false,
    },
    {
      icon: <FiUsers className="w-6 h-6 flex-shrink-0" />,
      label: "Employees",
      path: "/dashboard/employees",
      exact: true,
    },
    {
      icon: <HiOutlineOfficeBuilding className="w-6 h-6 flex-shrink-0" />,
      label: "Departments",
      path: "/dashboard/departments",
      exact: false,
    },
    {
      icon: <FaDatabase className="w-6 h-6 flex-shrink-0" />,
      label: "Master Data",
      path: "/dashboard/master-data",
      exact: false,
      isParent: true,
      children: [
        {
          icon: <LuUserCog className="w-5 h-5 flex-shrink-0" />,
          label: "Roles",
          path: "/dashboard/roles",
          exact: false,
        },
        {
          icon: <FaLayerGroup className="w-5 h-5 flex-shrink-0" />,
          label: "Employee Level",
          path: "/dashboard/employee-level",
          exact: false,
        },
        {
          icon: <FiFolder className="w-5 h-5 flex-shrink-0" />,
          label: "Document Categories",
          path: "/dashboard/document-categories",
          exact: false,
        },
        {
          icon: <FiCalendar className="w-5 h-5 flex-shrink-0" />,
          label: "Documents",
          path: "/dashboard/documents",
          exact: false,
        },
      ],
    },
    {
      icon: <FaClock className="w-6 h-6 flex-shrink-0" />,
      label: "Attendance",
      path: "/dashboard/attendance",
      exact: false,
      isParent: true,
      children: [
        {
          icon: <FaRegFileAlt className="w-5 h-5 flex-shrink-0" />,
          label: "Leave Applications",
          path: "/dashboard/leave-applications",
          exact: false,
        },
        {
          icon: <FaBook className="w-5 h-5 flex-shrink-0" />,
          label: "Leave Ledger",
          path: "/dashboard/leave-ledger",
          exact: false,
        },
        {
          icon: <FaRegCalendarAlt className="w-5 h-5 flex-shrink-0" />,
          label: "Company Calendar",
          path: "/dashboard/company-calendar",
          exact: false,
        },
      ],
    },
    {
      icon: <FaStar className="w-6 h-6 flex-shrink-0" />,
      label: "Performance",
      path: "/dashboard/performance",
      exact: false,
      isParent: true,
      children: [
        {
          icon: <FaBullseye className="w-5 h-5 flex-shrink-0" />,
          label: "Performance Goals",
          path: "/dashboard/performance-goals",
          exact: false,
        },
        {
          icon: <FaRegStar className="w-5 h-5 flex-shrink-0" />,
          label: "Employee Star Ratings",
          path: "/dashboard/employee-star-ratings",
          exact: false,
        },
        {
          icon: <FaFileAlt className="w-5 h-5 flex-shrink-0" />,
          label: "Evaluation Templates",
          path: "/dashboard/employee-evaluation-template",
          exact: false,
        },
        {
          icon: <FaStar className="w-5 h-5 flex-shrink-0" />,
          label: "Employee Rating Parameters",
          path: "/dashboard/employee-rating-parameters",
          exact: false,
        },
        {
          icon: <FaAward className="w-5 h-5 flex-shrink-0" />,
          label: "Award Programs",
          path: "/dashboard/award-programs",
          exact: false,
        },
        {
          icon: <FaTrophy className="w-5 h-5 flex-shrink-0" />,
          label: "Award Winners",
          path: "/dashboard/award-winners",
          exact: false,
        },
      ],
    },
    {
      icon: <FaShieldAlt className="w-6 h-6 flex-shrink-0" />,
      label: "Employee Permissions",
      path: "/dashboard/employee-permissions",
      exact: false,
    },
    {
      icon: <FaComments className="w-6 h-6 flex-shrink-0" />,
      label: "Peer Feedback",
      path: "/dashboard/peer-feedback",
      exact: false,
    },
    {
      icon: <FaClipboardList className="w-6 h-6 flex-shrink-0" />,
      label: "Compliance",
      path: "/dashboard/compliance",
      exact: false,
      isParent: true,
      children: [
        {
          icon: <FaFolderOpen className="w-5 h-5 flex-shrink-0" />,
          label: "Filing",
          path: "/dashboard/filing",
          exact: false,
        },
        {
          icon: <FaCalendarAlt className="w-5 h-5 flex-shrink-0" />,
          label: "Board Meetings",
          path: "/dashboard/board-meetings",
          exact: false,
        },
      ],
    },
    {
      icon: <FaUserPlus className="w-6 h-6 flex-shrink-0 ml-1" />,
      label: "Recruitments",
      path: "/dashboard/recruitments",
      exact: false,
      isParent: true,
      children: [
        {
          icon: <FaFileSignature className="w-5 h-5 flex-shrink-0" />,
          label: "Recruitment Requests",
          path: "/dashboard/recruitment-requests",
          exact: false,
        },
      ],
    },
  ];

  const isActive = (item) => {
    return pathname.startsWith(item.path);
  };

  const isMasterDataActive = () => {
    const masterDataPaths = [
      "/dashboard/roles",
      "/dashboard/employee-level",
      "/dashboard/document-categories",
      "/dashboard/documents",
    ];
    return masterDataPaths.some((path) => pathname.startsWith(path));
  };

  const isAttendanceActive = () => {
    const attendancePaths = [
      "/dashboard/leave-applications",
      "/dashboard/leave-ledger",
      "/dashboard/company-calendar",
    ];
    return attendancePaths.some((path) => pathname.startsWith(path));
  };

  const isPerformanceActive = () => {
    const performancePaths = [
      "/dashboard/performance-goals",
      "/dashboard/employee-star-ratings",
      "/dashboard/employee-evaluation-template",
      "/dashboard/employee-rating-parameters",
      "/dashboard/award-programs",
      "/dashboard/award-winners",
    ];
    return performancePaths.some((path) => pathname.startsWith(path));
  };

  const isComplianceActive = () => {
    const compliancePaths = ["/dashboard/filing", "/dashboard/board-meetings"];
    return compliancePaths.some((path) => pathname.startsWith(path));
  };

  const isRecruitmentsActive = () => {
    const recruitmentsPaths = ["/dashboard/recruitment-requests"];
    return recruitmentsPaths.some((path) => pathname.startsWith(path));
  };

  const showContent =
    (!isMobileView && isOpen) || (isMobileView && isMobileOpen);

  const [anchorEl, setAnchorEl] = useState(null);
  const [hoveredParent, setHoveredParent] = useState(null);

  useState(() => {
    if (isMasterDataActive()) {
      setIsMasterDataOpen(true);
    }
    if (isAttendanceActive()) {
      setIsAttendanceOpen(true);
    }
    if (isPerformanceActive()) {
      setIsPerformanceOpen(true);
    }
    if (isComplianceActive()) {
      setIsComplianceOpen(true);
    }
    if (isRecruitmentsActive()) {
      setIsRecruitmentsOpen(true);
    }
  }, [pathname]);

  const handleMasterDataToggle = () => {
    setIsMasterDataOpen(!isMasterDataOpen);
  };

  const handleAttendanceToggle = () => {
    setIsAttendanceOpen(!isAttendanceOpen);
  };

  const handlePerformanceToggle = () => {
    setIsPerformanceOpen(!isPerformanceOpen);
  };

  const handleComplianceToggle = () => {
    setIsComplianceOpen(!isComplianceOpen);
  };

  const handleRecruitmentsToggle = () => {
    setIsRecruitmentsOpen(!isRecruitmentsOpen);
  };

  const handleParentMouseEnter = (event, parentLabel) => {
    if (!showContent) {
      setAnchorEl(event.currentTarget);
      setHoveredParent(parentLabel);
    }
  };

  const handleParentMouseLeave = () => {
    if (!showContent) {
      setAnchorEl(null);
    }
  };

  const handlePopoverMouseEnter = () => {
    if (!showContent) {
      setAnchorEl(anchorEl);
    }
  };

  const handlePopoverMouseLeave = () => {
    if (!showContent) {
      setAnchorEl(null);
      setHoveredParent(null);
    }
  };

  const open = Boolean(anchorEl) && !showContent;

  return (
    <>
      {isMobileView && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={`fixed h-[calc(100vh-4rem)] bg-white shadow-sm z-20 transition-all duration-300 ease-in-out ${
          isMobileView
            ? `${isMobileOpen ? "translate-x-0" : "-translate-x-full"} w-64`
            : `${isOpen ? "w-64" : "w-20"}`
        }`}
      >
        <div className="h-full overflow-y-auto py-4">
          <nav className="mt-2">
            <ul>
              {navItems.map((item, index) => (
                <li
                  key={index}
                  className="px-4 py-2"
                  onMouseLeave={handleParentMouseLeave}
                >
                  {item.isParent ? (
                    <div className="relative">
                      <div
                        className={`flex items-center p-2 rounded-lg cursor-pointer ${
                          (item.label === "Master Data" &&
                            isMasterDataActive()) ||
                          (item.label === "Attendance" &&
                            isAttendanceActive()) ||
                          (item.label === "Performance" &&
                            isPerformanceActive()) ||
                          (item.label === "Compliance" &&
                            isComplianceActive()) ||
                          (item.label === "Recruitments" &&
                            isRecruitmentsActive())
                            ? "bg-[rgb(234,248,244)] text-[rgb(63,197,149)]"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                        onClick={
                          showContent
                            ? item.label === "Master Data"
                              ? handleMasterDataToggle
                              : item.label === "Attendance"
                              ? handleAttendanceToggle
                              : item.label === "Performance"
                              ? handlePerformanceToggle
                              : item.label === "Compliance"
                              ? handleComplianceToggle
                              : item.label === "Recruitments"
                              ? handleRecruitmentsToggle
                              : undefined
                            : undefined
                        }
                        onMouseEnter={(e) =>
                          handleParentMouseEnter(e, item.label)
                        }
                      >
                        {item.icon}
                        {showContent && (
                          <>
                            <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis flex-1">
                              {item.label}
                            </span>
                            {(item.label === "Master Data" &&
                              isMasterDataOpen) ||
                            (item.label === "Attendance" && isAttendanceOpen) ||
                            (item.label === "Performance" &&
                              isPerformanceOpen) ||
                            (item.label === "Compliance" && isComplianceOpen) ||
                            (item.label === "Recruitments" &&
                              isRecruitmentsOpen) ? (
                              <FiChevronDown className="w-4 h-4" />
                            ) : (
                              <FiChevronRight className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </div>

                      {showContent &&
                        ((item.label === "Master Data" && isMasterDataOpen) ||
                          (item.label === "Attendance" && isAttendanceOpen) ||
                          (item.label === "Performance" && isPerformanceOpen) ||
                          (item.label === "Compliance" && isComplianceOpen) ||
                          (item.label === "Recruitments" &&
                            isRecruitmentsOpen)) && (
                          <ul className="ml-4 mt-2 space-y-1">
                            {item.children.map((child, childIndex) => (
                              <li key={childIndex}>
                                <Link
                                  href={child.path}
                                  className={`flex items-center p-2 rounded-lg text-sm ${
                                    isActive(child)
                                      ? "bg-[rgb(234,248,244)] text-[rgb(63,197,149)]"
                                      : "text-gray-600 hover:bg-gray-100"
                                  }`}
                                >
                                  {child.icon}
                                  <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis">
                                    {child.label}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>
                  ) : (
                    <Link
                      href={item.path}
                      className={`flex items-center p-2 rounded-lg ${
                        isActive(item)
                          ? "bg-[rgb(234,248,244)] text-[rgb(63,197,149)]"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {item.icon}
                      {showContent && (
                        <span className="ml-3 whitespace-nowrap overflow-hidden overflow-ellipsis">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        disableRestoreFocus
        sx={{
          pointerEvents: "none",
          "& .MuiPopover-paper": {
            pointerEvents: "auto",
            marginLeft: "8px",
            minWidth: "192px",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
          },
        }}
        slotProps={{
          paper: {
            onMouseEnter: handlePopoverMouseEnter,
            onMouseLeave: handlePopoverMouseLeave,
          },
        }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-2">
          <div className="px-3 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
            {hoveredParent}
          </div>
          {navItems
            .find((item) => item.label === hoveredParent)
            ?.children.map((child, childIndex) => (
              <Link
                key={childIndex}
                href={child.path}
                className={`flex items-center px-3 py-2 text-sm hover:bg-gray-50 ${
                  isActive(child)
                    ? "bg-[rgb(234,248,244)] text-[rgb(63,197,149)]"
                    : "text-gray-600"
                }`}
              >
                {child.icon}
                <span className="ml-3">{child.label}</span>
              </Link>
            ))}
        </div>
      </Popover>
    </>
  );
}
