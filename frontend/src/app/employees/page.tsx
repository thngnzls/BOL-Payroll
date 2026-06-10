"use client";

import { useState, useEffect, useRef } from "react";
import { endpoints, Employee } from "@/lib/api";
import {
  Edit2,
  Trash2,
  Plus,
  UserPlus,
  ChevronDown,
  Search,
} from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Form States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [experience, setExperience] = useState("");
  const [dailyRate, setDailyRate] = useState<string>("");

  // Combo Box State
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const experienceOptions = [
    "Labor",
    "Tiler",
    "Carpenter",
    "Mason",
    "Foreman",
    "Painter",
    "Welder",
    "Steelman",
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await endpoints.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setName(emp.name);
    setExperience(emp.experience);
    setDailyRate(emp.daily_rate.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      await endpoints.deleteEmployee(id);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("Failed to delete employee");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name, experience, daily_rate: parseFloat(dailyRate) };

    try {
      if (editingId) {
        await endpoints.updateEmployee(editingId, payload);
      } else {
        await endpoints.createEmployee(payload);
      }
      // Reset form
      setName("");
      setExperience("");
      setDailyRate("");
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      console.error(error);
      alert("Failed to save employee.");
    }
  };

  // Filter & Sort Logic
  const filteredEmployees = employees
    .filter((e) => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-[1400px] mx-auto p-6 space-y-6">
      <div className="border-b border-gray-200 pb-4 flex items-center gap-4">
        <div className="bg-[#990000] p-2.5 rounded-xl shadow-sm">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage personnel roles and daily compensation rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form PANE */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-bold text-[#990000] mb-6 border-b pb-2 flex items-center gap-2">
            {editingId ? (
              <Edit2 className="w-5 h-5" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {editingId ? "Edit Profile" : "Register Employee"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20"
            />

            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                placeholder="Role/Experience..."
                required
                value={experience}
                onChange={(e) => {
                  setExperience(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-3 top-3 text-gray-400"
              >
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showDropdown && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                  {experienceOptions
                    .filter((o) =>
                      o.toLowerCase().includes(experience.toLowerCase()),
                    )
                    .map((o) => (
                      <li
                        key={o}
                        onClick={() => {
                          setExperience(o);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-red-50 hover:text-[#990000] cursor-pointer text-sm transition-colors"
                      >
                        {o}
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <input
              type="number"
              placeholder="Daily Rate (₱)"
              required
              min="0"
              step="0.01"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-[#990000]/20 font-mono"
            />

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-[#990000] text-white py-2.5 rounded-lg hover:bg-[#7a0000] transition-colors shadow-sm"
              >
                {editingId ? "Save Changes" : "Add Employee"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setName("");
                    setExperience("");
                    setDailyRate("");
                    setEditingId(null);
                  }}
                  className="bg-white text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300 shadow-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table PANE */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-fit overflow-hidden">
          {/* Table Header Controls */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#990000]/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#990000] text-white border-b-2 border-[#7a0000]">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">
                    Role / Experience
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">
                    Daily Rate
                  </th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-center w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500 animate-pulse"
                    >
                      Loading directory...
                    </td>
                  </tr>
                ) : filteredEmployees.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No employees match your search.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.id}
                      className="hover:bg-red-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {emp.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-200">
                          {emp.experience}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#990000] font-mono">
                        ₱
                        {Number(emp.daily_rate).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Dark Footer */}
          <div className="bg-[#2d3748] text-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider flex justify-between">
            <span>Total Employees: {filteredEmployees.length}</span>
            <span>Sorted Alphabetically (A-Z)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
