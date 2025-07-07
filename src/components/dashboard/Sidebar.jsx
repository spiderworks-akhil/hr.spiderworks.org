"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiUsers, FiCalendar, FiFolder } from "react-icons/fi";
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
} from "react-icons/fa";

export default function Sidebar({
  isOpen,
  isMobileOpen,
  isMobileView,
  closeMobileSidebar,
}) {
  const pathname = usePathname();

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
      icon: <LuUserCog className="w-6 h-6 flex-shrink-0" />,
      label: "Roles",
      path: "/dashboard/roles",
      exact: false,
    },
    {
      icon: <FaLayerGroup className="w-6 h-6 flex-shrink-0" />,
      label: "Employee Level",
      path: "/dashboard/employee-level",
      exact: false,
    },
    {
      icon: <FiFolder className="w-6 h-6 flex-shrink-0" />,
      label: "Document Categories",
      path: "/dashboard/document-categories",
      exact: false,
    },
    {
      icon: <FiCalendar className="w-6 h-6 flex-shrink-0" />,
      label: "Documents",
      path: "/dashboard/documents",
      exact: false,
    },
    {
      icon: <FaShieldAlt className="w-6 h-6 flex-shrink-0" />,
      label: "Employee Permissions",
      path: "/dashboard/employee-permissions",
      exact: false,
    },
    {
      icon: <FaStar className="w-6 h-6 flex-shrink-0" />,
      label: "Employee Rating Parameters",
      path: "/dashboard/employee-rating-parameters",
      exact: false,
    },
    {
      icon: <FaComments className="w-6 h-6 flex-shrink-0" />,
      label: "Peer Feedback",
      path: "/dashboard/peer-feedback",
      exact: false,
    },
    {
      icon: <FaAward className="w-6 h-6 flex-shrink-0" />,
      label: "Award Programs",
      path: "/dashboard/award-programs",
      exact: false,
    },
    {
      icon: <FaTrophy className="w-6 h-6 flex-shrink-0" />,
      label: "Award Winners",
      path: "/dashboard/award-winners",
      exact: false,
    },
    {
      icon: <FaFileAlt className="w-6 h-6 flex-shrink-0" />,
      label: "Evaluation Templates",
      path: "/dashboard/employee-evaluation-template",
      exact: false,
    },
    {
      icon: <FaBullseye className="w-6 h-6 flex-shrink-0" />,
      label: "Performance Goals",
      path: "/dashboard/performance-goals",
      exact: false,
    },
    {
      icon: <FaRegStar className="w-6 h-6 flex-shrink-0" />,
      label: "Employee Star Ratings",
      path: "/dashboard/employee-star-ratings",
      exact: false,
    },
    {
      icon: <FaClipboardList className="w-6 h-6 flex-shrink-0" />,
      label: "Compliance",
      path: "/dashboard/compliance",
      exact: false,
    },
    {
      icon: <FaCalendarAlt className="w-6 h-6 flex-shrink-0" />,
      label: "Board Meetings",
      path: "/dashboard/board-meetings",
      exact: false,
    },
    {
      icon: <FaRegFileAlt className="w-6 h-6 flex-shrink-0" />,
      label: "Leave Applications",
      path: "/dashboard/leave-applications",
      exact: false,
    },
    {
      icon: <FaBook className="w-6 h-6 flex-shrink-0" />,
      label: "Leave Ledger",
      path: "/dashboard/leave-ledger",
      exact: false,
    },
    {
      icon: <FaRegCalendarAlt className="w-6 h-6 flex-shrink-0" />,
      label: "Company Calendar",
      path: "/dashboard/company-calendar",
      exact: false,
    },
    {
      icon: <FaClipboardList className="w-6 h-6 flex-shrink-0" />,
      label: "Recruitment Requests",
      path: "/dashboard/recruitment-requests",
      exact: false,
    },
  ];

  const isActive = (item) => {
    return pathname.startsWith(item.path);
  };

  const showContent =
    (!isMobileView && isOpen) || (isMobileView && isMobileOpen);

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
                <li key={index} className="px-4 py-2">
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
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
