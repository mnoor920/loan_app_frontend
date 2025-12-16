"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/ui/dashboardlayout";
import DocumentViewerModal from "../../components/ui/DocumentViewerModal";
import {
  User,
  FileText,
  Shield,
  MapPin,
  CreditCard,
  PenTool,
  Eye,
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useProfileData } from "../../hooks/useProfileData";

interface ActivationProfile {
  id: string;
  userId: string;
  gender?: string;
  fullName?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  nationality?: string;
  agreedToTerms?: boolean;
  familyRelatives?: any[];
  residingCountry?: string;
  stateRegionProvince?: string;
  townCity?: string;
  idType?: string;
  idNumber?: string;
  accountType?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  signatureData?: string;
  activationStatus: string;
  currentStep: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserDocument {
  id: string;
  // Prefer camelCase from API, keep snake_case optional for backward compatibility
  userId?: string;
  user_id?: string;
  documentType?: string;
  document_type?: string;
  originalFilename?: string;
  original_filename?: string;
  filePath?: string;
  file_path?: string;
  fileSize?: number;
  file_size?: number;
  mimeType?: string;
  mime_type?: string;
  verificationStatus?: string;
  verification_status?: string;
  createdAt?: string;
  created_at?: string;
}

const ProfilePage = () => {
  const { user, loading } = useAuth();
  // Use relative URLs to go through Next.js API routes (ensures cookies are sent)

  // Use the new batch profile data hook with caching
  const {
    data: profileBatchData,
    loading: loadingProfile,
    error: profileError,
    refresh: refreshProfile,
    isFromCache
  } = useProfileData(user?.id || null);

  // Extract data from batch response
  const profile = profileBatchData?.profile;
  const documents = profileBatchData?.documents || [];
  const documentsByType = profileBatchData?.documentsByType || {};
  const progress = profileBatchData?.progress || 0;
  const stats = profileBatchData?.stats;

  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [selectedDocument, setSelectedDocument] = useState<UserDocument | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDocument = (document: UserDocument) => {
    setSelectedDocument(document);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDocument(null);
  };

  const handleEditSection = (section: string) => {
    setEditingSection(section);
    setIsEditing(true);

    // Initialize edit form data based on section
    switch (section) {
      case "personal":
        setEditFormData({
          fullName: profile?.fullName || "",
          gender: profile?.gender || "male",
          dateOfBirth: profile?.dateOfBirth || "",
          maritalStatus: profile?.maritalStatus || "",
          nationality: profile?.nationality || "",
        });
        break;
      case "address":
        setEditFormData({
          residingCountry: profile?.residingCountry || "",
          stateRegionProvince: profile?.stateRegionProvince || "",
          townCity: profile?.townCity || "",
        });
        break;
      case "id":
        setEditFormData({
          idType: profile?.idType || "NIC",
          idNumber: profile?.idNumber || "",
        });
        break;
      case "bank":
        setEditFormData({
          accountType: profile?.accountType || "bank",
          bankName: profile?.bankName || "",
          accountNumber: profile?.accountNumber || "",
          accountHolderName: profile?.accountHolderName || "",
        });
        break;
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSection) return;

    try {
      let step = 1;
      let stepData: any = {};

      switch (editingSection) {
        case "personal":
          step = 1;
          const dateParts = editFormData.dateOfBirth
            ? editFormData.dateOfBirth.split("-")
            : ["", "", ""];
          stepData = {
            gender: editFormData.gender,
            fullName: editFormData.fullName,
            dateOfBirth: {
              year: dateParts[0] || "",
              month: dateParts[1] || "",
              day: dateParts[2] || "",
            },
            maritalStatus: editFormData.maritalStatus,
            nationality: editFormData.nationality,
            agreedToTerms: true,
          };
          break;
        case "address":
          step = 3;
          stepData = {
            residingCountry: editFormData.residingCountry,
            stateRegionProvince: editFormData.stateRegionProvince,
            townCity: editFormData.townCity,
          };
          break;
        case "id":
          step = 4;
          stepData = {
            idType: editFormData.idType,
            idNumber: editFormData.idNumber,
          };
          break;
        case "bank":
          step = 5;
          stepData = {
            accountType: editFormData.accountType,
            bankName: editFormData.bankName,
            accountNumber: editFormData.accountNumber,
            accountHolderName: editFormData.accountHolderName,
          };
          break;
      }

      const response = await fetch('/api/activation/profile', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          step,
          data: stepData,
        }),
      });

      if (response.ok) {
        // Invalidate cache and refresh profile data
        await refreshProfile();

        setIsEditing(false);
        setEditingSection(null);
        setEditFormData({});
      } else {
        console.error("Failed to save profile data");
      }
    } catch (error) {
      console.error("Error saving profile data:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingSection(null);
    setEditFormData({});
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      // Use relative URL to go through Next.js API route (ensures cookies are sent)
      const response = await fetch('/api/activation/documents/upload', {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        // Invalidate cache and refresh profile data to get updated documents
        await refreshProfile();
      } else {
        console.error("Failed to upload document");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const displayName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user.email.split("@")[0];

  return (
    <DashboardLayout userName={displayName}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              My Profile
            </h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
                <User className="w-4 h-4" />
                <p>Manage your personal information and documents</p>
            </div>
          </div>
        
          <div className="flex items-center gap-3">
            {/* Cache and connection status */}
             <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-slate-100 rounded-full">
                {isFromCache ? (
                    <span className="text-slate-500 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Cached
                    </span>
                ) : (
                    <span className="text-emerald-600 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Live
                    </span>
                )}
            </div>

            <button
              onClick={refreshProfile}
              disabled={loadingProfile}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:shadow-sm border border-slate-200 rounded-lg transition-all disabled:opacity-50 bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProfile ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Activation Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
                 <h2 className="text-lg font-bold text-slate-900 mb-1">Account Status</h2>
                 <p className="text-slate-500 text-sm">Current verification level</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusColor(
                  profile?.activationStatus || "pending"
                )}`}
              >
                {profile?.activationStatus === "completed"
                  ? "✓ Verified"
                  : profile?.activationStatus === "in_progress"
                    ? "In Progress"
                    : "Pending"}
              </span>

              {/* Document stats */}
              {stats && (
                <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  {stats.totalDocuments} docs ({stats.verifiedDocuments} verified)
                </div>
              )}
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700">
                Completion Progress
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {profile?.completedAt && (
            <p className="text-xs text-slate-400 mt-2 text-right">
              Verified on {formatDate(profile.completedAt)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Personal Information
                </h3>
              </div>
              {!isEditing && (
                <button
                  onClick={() => handleEditSection("personal")}
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold hover:bg-emerald-50 px-3 py-1 rounded-lg transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditing && editingSection === "personal" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.fullName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        gender: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={editFormData.maritalStatus}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        maritalStatus: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={editFormData.nationality}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        nationality: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-5 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                        <p className="text-slate-900 font-medium">{profile?.fullName || "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Gender</label>
                        <p className="text-slate-900 font-medium capitalize">{profile?.gender || "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Date of Birth</label>
                        <p className="text-slate-900 font-medium">{profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Marital Status</label>
                        <p className="text-slate-900 font-medium capitalize">{profile?.maritalStatus || "Not provided"}</p>
                    </div>
                     <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Nationality</label>
                        <p className="text-slate-900 font-medium">{profile?.nationality || "Not provided"}</p>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Address Information
              </h3>
            </div>

            <div className="space-y-4">
               <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Country</label>
                        <p className="text-slate-900 font-medium">{profile?.residingCountry || "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">State / Province</label>
                        <p className="text-slate-900 font-medium">{profile?.stateRegionProvince || "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Town / City</label>
                        <p className="text-slate-900 font-medium">{profile?.townCity || "Not provided"}</p>
                    </div>
                </div>
            </div>
          </div>

          {/* ID Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Identification
              </h3>
            </div>

            <div className="space-y-4">
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">ID Type</label>
                        <p className="text-slate-900 font-medium">{profile?.idType || "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">ID Number</label>
                        <p className="text-slate-900 font-medium">{profile?.idNumber || "Not provided"}</p>
                    </div>
                </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Bank Information
              </h3>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Bank Name</label>
                        <p className="text-slate-900 font-medium">{profile?.bankName || "Not provided"}</p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Account Number</label>
                        <p className="text-slate-900 font-medium tracking-wider">
                           {profile?.accountNumber
                            ? `**** ${profile.accountNumber.slice(-4)}`
                            : "Not provided"}
                        </p>
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Account Holder</label>
                        <p className="text-slate-900 font-medium">{profile?.accountHolderName || "Not provided"}</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        {profile?.signatureData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Digital Signature
              </h3>
            </div>

            <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50/30">
              <img 
                src={profile.signatureData} 
                alt="Digital Signature" 
                className="max-h-32 mx-auto"
              />
            </div>
          </div>
        )}

        {/* Family/Character References */}
        {profile?.familyRelatives && profile.familyRelatives.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Character References
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.familyRelatives.map((relative: any, index: number) => (
                <div
                  key={index}
                  className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 hover:border-indigo-100 transition-colors"
                >
                  <h4 className="font-bold text-slate-900">
                    {relative.fullName}
                  </h4>
                  <p className="text-xs text-slate-500 capitalize font-medium mb-1">
                    {relative.relationship}
                  </p>
                  <p className="text-sm text-slate-600">
                    {relative.phoneNumber}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Uploaded Documents
              </h3>
            </div>
            {!isEditing && (
                <button
                onClick={() => setEditingSection("documents")}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold hover:bg-emerald-50 px-3 py-1 rounded-lg transition-colors"
                >
                Add / Manage
                </button>
            )}
          </div>

          {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow group bg-slate-50/30"
                >
                  <div className="mb-3">
                    <h4 className="font-bold text-slate-900 capitalize text-sm">
                      {(
                        (document as any).documentType ??
                        (document as any).document_type ??
                        "unknown"
                      ).replace(/_/g, " ")}
                    </h4>
                    <p
                      className="text-xs text-slate-500 truncate"
                      title={
                        (document as any).originalFilename ??
                        (document as any).original_filename ??
                        "Unknown file"
                      }
                    >
                      {(document as any).originalFilename ??
                        (document as any).original_filename ??
                        "Unknown file"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4 bg-white p-2 rounded-lg border border-slate-100">
                    <span>
                      {(document as any).fileSize || (document as any).file_size
                        ? `${Math.round(
                            ((document as any).fileSize ??
                              (document as any).file_size) / 1024
                          )} KB`
                        : "Unknown size"}
                    </span>
                    <span>
                      {formatDate(
                        (document as any).createdAt ??
                          (document as any).created_at ??
                          ""
                      )}
                    </span>
                  </div>

                  <button
                    onClick={() => handleViewDocument(document)}
                    className="w-full bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 group-hover:border-emerald-300"
                  >
                    <Eye className="w-4 h-4" />
                    View File
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4 font-medium">
                No documents uploaded yet
              </p>
              <button
                onClick={() => setEditingSection("documents")}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 font-semibold"
              >
                Upload Documents
              </button>
            </div>
          )}

          {/* Document Upload Section */}
          {editingSection === "documents" && (
            <div className="mt-8 p-6 border border-emerald-100 rounded-xl bg-emerald-50/30 animate-in fade-in slide-in-from-top-4">
              <h4 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                Upload New Documents
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { type: "id_front", label: "NIC Front Side" },
                  { type: "id_back", label: "NIC Back Side" },
                  { type: "selfie", label: "Your Selfie" },
                  { type: "passport_photo", label: "Passport Size Photo" },
                  { type: "driver_license", label: "Driver License (Optional)" },
                ].map(({ type, label }) => (
                  <div key={type} className="space-y-2 group">
                    <label className="block text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                      {label}
                    </label>
                    <div className="relative">
                        <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                            handleFileUpload(file, type);
                            }
                        }}
                        className="w-full text-sm text-slate-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-emerald-50 file:text-emerald-700
                            hover:file:bg-emerald-100
                            cursor-pointer
                        "
                        />
                    </div>
                    {documentsByType[type] &&
                      documentsByType[type].length > 0 && (
                        <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                          <CheckCircle className="w-3 h-3" /> Uploaded: {documentsByType[type][0].original_filename}
                        </p>
                      )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-8 pt-4 border-t border-emerald-100">
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 font-bold"
                >
                  Done Uploading
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Signature */}
        {profile?.signature_data && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Digital Signature
              </h3>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50/50 flex justify-center">
              <img
                src={profile.signature_data}
                alt="Digital Signature"
                className="max-w-full h-auto opacity-80"
                style={{ maxHeight: "120px" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        document={selectedDocument ? {
          id: selectedDocument.id,
          document_type: selectedDocument.document_type || selectedDocument.documentType || 'unknown',
          original_filename: selectedDocument.original_filename || selectedDocument.originalFilename,
          file_size: selectedDocument.file_size || selectedDocument.fileSize,
          mime_type: selectedDocument.mime_type || selectedDocument.mimeType,
        } : null}
      />
    </DashboardLayout>
  );
};

export default ProfilePage;
