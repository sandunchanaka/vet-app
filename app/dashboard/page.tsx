'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User } from '@/types/user';
import UserManagement from '@/components/UserManagement';
import UserTypeManagement from '@/components/UserTypeManagement';
import PetCategoriesManagement from '@/components/PetCategoriesManagement';
import PetBreedsManagement from '@/components/PetBreedsManagement';
import DrugsManagement from '@/components/DrugsManagement';
import ServicesManagement from '@/components/ServicesManagement';
import VaccinationTypesManagement from '@/components/VaccinationTypesManagement';
import PetManagement from '@/components/PetManagement';
import VeterinariansManagement from '@/components/VeterinariansManagement';
import PetSearch from '@/components/PetSearch';
import DosageMasterManagement from '@/components/DosageMasterManagement';
import BillingTemplate from '@/components/BillingTemplate';
import BillsList from '@/components/BillsList';
import BillingSearch from '@/components/BillingSearch';
import DoctorReport from '@/components/DoctorReport';
import VaccinationSales from '@/components/VaccinationSales';
import Sidebar from '@/components/Sidebar';
import { CurrencyProvider } from '@/context/CurrencyContext';
import SystemSettings from '@/components/SystemSettings';

function UserMenu({
  user,
  onLogout,
  onOpenProfile,
  onOpenPassword
}: {
  user: User;
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenPassword: () => void;
}) {
  const [open, setOpen] = useState(false);
  const fullName = `${user.first_name} ${user.last_name}`;
  const userType = user.user_type_name || 'User';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center space-x-3 px-3 py-2 rounded-full border border-gray-200 hover:border-green-500 bg-white shadow-sm transition"
      >
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">{fullName}</p>
          <p className="text-xs text-gray-500">{userType}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
            {user.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">{fullName}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenPassword();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Change Password
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billIdParam = searchParams.get('billId');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'dashboard');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setProfileForm({
        first_name: parsedUser.first_name || '',
        last_name: parsedUser.last_name || '',
        email: parsedUser.email || '',
        phone_number: parsedUser.phone_number || parsedUser.phone || ''
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    if (tab !== 'edit-bill') {
      params.delete('billId');
    }
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    document.cookie = 'auth_token=; Max-Age=0; path=/; SameSite=Lax';
    router.push('/login');
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileMessage(null);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!data.success) {
        setProfileMessage(data.message || 'Failed to update profile');
        return;
      }
      const updatedUser = { ...user, ...profileForm };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfileMessage('Profile updated');
      setShowProfileModal(false);
    } catch (err) {
      setProfileMessage('Failed to update profile');
    }
  };

  const handlePasswordSave = async () => {
    if (!user) return;
    setPasswordMessage(null);
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage('Passwords do not match');
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });
      const data = await res.json();
      if (!data.success) {
        setPasswordMessage(data.message || 'Failed to change password');
        return;
      }
      setPasswordMessage('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPasswordModal(false);
    } catch (err) {
      setPasswordMessage('Failed to change password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900">
        <div className="text-white text-xl flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading Veterinary System...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <CurrencyProvider>
      <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} user={user} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex justify-between items-center h-16 px-6">
            <div>
              { /*<h1 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-sm text-gray-600">
                Veterinary Hospital Management System
              </p> */ }
            </div>
            <UserMenu
              user={user}
              onLogout={handleLogout}
              onOpenProfile={() => setShowProfileModal(true)}
              onOpenPassword={() => setShowPasswordModal(true)}
            />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* Dashboard Content */}
          {activeTab === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome to VetCare Hospital
                </h2>
                <p className="text-gray-600 text-lg">
                  Manage your veterinary practice with comprehensive animal care and medical record management.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Patients</p>
                      <p className="text-2xl font-bold text-gray-900">24</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                      <p className="text-2xl font-bold text-gray-900">8</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Tests</p>
                      <p className="text-2xl font-bold text-gray-900">3</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-gray-900">5</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Profile Card */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">Name</label>
                    <p className="text-gray-900">{user.first_name} {user.last_name}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">Email</label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">Phone</label>
                    <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">User Type</label>
                    <p className="text-gray-900">{user.user_type_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm font-medium mb-1">Member Since</label>
                    <p className="text-gray-900">{new Date(user.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">Patient Records</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Comprehensive medical records for all animal patients with treatment history and notes.
                  </p>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                    View Patients
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">Appointments</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Manage veterinary appointments, consultations, and follow-up visits efficiently.
                  </p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                    Schedule Appointment
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">Medical Records</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Track lab results, X-rays, and diagnostic tests with comprehensive reporting.
                  </p>
                  <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                    View Records
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Other Tab Content */}
          {activeTab === 'pets' && (
            <PetManagement />
          )}

          {activeTab === 'veterinarians' && (
            <VeterinariansManagement />
          )}

          {activeTab === 'search-pets' && (
            <PetSearch />
          )}

          {activeTab === 'new-bill' && (
            <BillingTemplate />
          )}

          {activeTab === 'edit-bill' && (
            billIdParam ? (
              <BillingTemplate mode="edit" billId={billIdParam} onSuccessRedirect="/dashboard?tab=list-bills" />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Select a Bill to Edit</h2>
                <p className="text-gray-600">No bill was specified. Please return to the bill list and choose Edit on the desired record.</p>
              </div>
            )
          )}

          {activeTab === 'list-bills' && (
            <BillsList />
          )}

          {activeTab === 'billing-search' && (
            <BillingSearch />
          )}

          {activeTab === 'billing-report' && (
            <BillingSearch mode="report" />
          )}

          {activeTab === 'doctor-report' && (
            <DoctorReport />
          )}

          {activeTab === 'vaccination-sales' && (
            <VaccinationSales />
          )}

          {activeTab === 'patients' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient Management</h2>
              <p className="text-gray-600">Patient management features coming soon...</p>
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointment Scheduling</h2>
              <p className="text-gray-600">Appointment scheduling features coming soon...</p>
            </div>
          )}

          {activeTab === 'medical-records' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Medical Records</h2>
              <p className="text-gray-600">Medical records management features coming soon...</p>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Diagnostics</h2>
              <p className="text-gray-600">Diagnostic tools and lab results coming soon...</p>
            </div>
          )}

          {activeTab === 'treatment-plans' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Treatment Plans</h2>
              <p className="text-gray-600">Treatment plan management features coming soon...</p>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Inventory Management</h2>
              <p className="text-gray-600">Inventory management features coming soon...</p>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Billing & Payments</h2>
              <p className="text-gray-600">Billing and payment management features coming soon...</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports & Analytics</h2>
              <p className="text-gray-600">Reports and analytics features coming soon...</p>
            </div>
          )}

          {/* Staff Management Tab */}
          {activeTab === 'staff-management' && user?.user_type === 1 && (
            <UserManagement />
          )}

          {/* User Type Management Tab */}
          {activeTab === 'user-type-management' && user?.user_type === 1 && (
            <UserTypeManagement />
          )}

          {/* Settings Tabs */}
          {activeTab === 'user-types' && user?.user_type === 1 && (
            <UserTypeManagement />
          )}

          {activeTab === 'pet-categories' && user?.user_type === 1 && (
            <PetCategoriesManagement />
          )}

          {activeTab === 'pet-breeds' && user?.user_type === 1 && (
            <PetBreedsManagement />
          )}

          {activeTab === 'drugs' && user?.user_type === 1 && (
            <DrugsManagement />
          )}

          {activeTab === 'services' && user?.user_type === 1 && (
            <ServicesManagement />
          )}

          {activeTab === 'vaccinations' && user?.user_type === 1 && (
            <VaccinationTypesManagement />
          )}

          {activeTab === 'dosage-master' && user?.user_type === 1 && (
            <DosageMasterManagement />
          )}

          {activeTab === 'system-settings' && user?.user_type === 1 && (
            <SystemSettings />
          )}
        </main>
      </div>
    </div>
    {showProfileModal && (
      <ProfileModal
        form={profileForm}
        message={profileMessage}
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileSave}
        onChange={(field, value) =>
          setProfileForm((prev) => ({
            ...prev,
            [field]: value
          }))
        }
      />
    )}
    {showPasswordModal && (
      <PasswordModal
        form={passwordForm}
        message={passwordMessage}
        onClose={() => setShowPasswordModal(false)}
        onSave={handlePasswordSave}
        onChange={(field, value) =>
          setPasswordForm((prev) => ({
            ...prev,
            [field]: value
          }))
        }
      />
    )}
    </CurrencyProvider>
  );
}

function ProfileModal({
  form,
  onChange,
  onClose,
  onSave,
  message
}: {
  form: { first_name: string; last_name: string; email: string; phone_number: string };
  onChange: (field: keyof typeof form, value: string) => void;
  onClose: () => void;
  onSave: () => void;
  message: string | null;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => onChange('first_name', e.target.value)}
            placeholder="First Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => onChange('last_name', e.target.value)}
            placeholder="Last Name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          type="tel"
          value={form.phone_number}
          onChange={(e) => onChange('phone_number', e.target.value)}
          placeholder="Phone Number"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {message && <p className="text-sm text-red-600">{message}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Update Profile
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PasswordModal({
  form,
  onChange,
  onClose,
  onSave,
  message
}: {
  form: { current_password: string; new_password: string; confirm_password: string };
  onChange: (field: keyof typeof form, value: string) => void;
  onClose: () => void;
  onSave: () => void;
  message: string | null;
}) {
  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
        <input
          type="password"
          value={form.current_password}
          onChange={(e) => onChange('current_password', e.target.value)}
          placeholder="Current Password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          type="password"
          value={form.new_password}
          onChange={(e) => onChange('new_password', e.target.value)}
          placeholder="New Password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <input
          type="password"
          value={form.confirm_password}
          onChange={(e) => onChange('confirm_password', e.target.value)}
          placeholder="Confirm New Password"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {message && <p className="text-sm text-red-600">{message}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Update Password
          </button>
        </div>
      </div>
    </Modal>
  );
}
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
