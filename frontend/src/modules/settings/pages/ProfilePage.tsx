/**
 * Profile Page - User profile information, target companies, timeline
 */

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useThemeStore } from '@/store/themeStore';
import { apiClient } from '@/services/apiClient';
import { ChevronRight, Edit2, Save, User, Mail, Building, Calendar } from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  targetCompanies: string[];
  interviewTimeline?: string;
  yearsOfExperience?: number;
  linkedinUrl?: string;
  gitHubUrl?: string;
}

export default function ProfilePage() {
  const { isDark } = useThemeStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Alex Johnson',
    email: 'alex@example.com',
    avatar: '👨‍💻',
    bio: 'Software Engineer passionate about competitive programming and system design',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Microsoft'],
    interviewTimeline: '3 months',
    yearsOfExperience: 3,
    linkedinUrl: 'https://linkedin.com/in/alexjohnson',
    gitHubUrl: 'https://github.com/alexjohnson',
  });

  const [editedProfile, setEditedProfile] = useState(profile);
  const allCompanies = [
    'Google', 'Amazon', 'Meta', 'Apple', 'Microsoft',
    'Tesla', 'Netflix', 'Uber', 'Airbnb', 'LinkedIn',
    'Adobe', 'Salesforce', 'Oracle', 'IBM', 'GoldmanSachs',
    'JPMorgan', 'Stripe', 'Dropbox', 'Splunk', 'Twilio',
  ];

  const handleToggleCompany = (company: string) => {
    setEditedProfile({
      ...editedProfile,
      targetCompanies: editedProfile.targetCompanies.includes(company)
        ? editedProfile.targetCompanies.filter(c => c !== company)
        : [...editedProfile.targetCompanies, company],
    });
  };

  const handleSave = async () => {
    setProfile(editedProfile);
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <Header />

      <main className="p-6 ml-60">
        {/* Breadcrumb */}
        <div className={`flex items-center gap-2 mb-6 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Profile</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            👤 Profile Settings
          </h1>
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setEditedProfile(profile);
                setIsEditing(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            {isEditing ? (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-5 h-5" />
                Edit Profile
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className={`p-8 rounded-xl border text-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="text-6xl mb-4">{profile.avatar}</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {profile.name}
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {profile.email}
            </p>

            {profile.bio && (
              <p className={`mt-4 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {profile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Experience</div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {profile.yearsOfExperience}y
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Timeline</div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {profile.interviewTimeline}
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-2 justify-center mt-6">
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  LinkedIn
                </a>
              )}
              {profile.gitHubUrl && (
                <a
                  href={profile.gitHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-4 py-2 rounded-lg border transition ${
                    isDark
                      ? 'bg-slate-700 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-100 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  GitHub
                </a>
              )}
            </div>
          </div>

          {/* Right Column - Edit Form */}
          <div className={`lg:col-span-2 p-8 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            {isEditing ? (
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border transition ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border transition ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Bio
                  </label>
                  <textarea
                    value={editedProfile.bio || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border transition resize-none ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                    rows={3}
                  />
                </div>

                {/* Experience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      value={editedProfile.yearsOfExperience || 0}
                      onChange={(e) => setEditedProfile({ ...editedProfile, yearsOfExperience: parseInt(e.target.value) })}
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`text-sm font-medium mb-2 flex items-center gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <Calendar className="w-4 h-4" />
                      Interview Timeline
                    </label>
                    <input
                      type="text"
                      value={editedProfile.interviewTimeline || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, interviewTimeline: e.target.value })}
                      placeholder="e.g., 3 months"
                      className={`w-full px-4 py-2 rounded-lg border transition ${
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* Social Links */}
                <div className="space-y-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Social Links
                  </label>
                  <input
                    type="url"
                    value={editedProfile.linkedinUrl || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, linkedinUrl: e.target.value })}
                    placeholder="LinkedIn URL"
                    className={`w-full px-4 py-2 rounded-lg border transition ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                  <input
                    type="url"
                    value={editedProfile.gitHubUrl || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, gitHubUrl: e.target.value })}
                    placeholder="GitHub URL"
                    className={`w-full px-4 py-2 rounded-lg border transition ${
                      isDark
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email</div>
                  <div className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {profile.email}
                  </div>
                </div>

                {profile.bio && (
                  <div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Bio</div>
                    <div className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {profile.bio}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Years of Experience</div>
                    <div className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {profile.yearsOfExperience} years
                    </div>
                  </div>
                  <div>
                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Interview Timeline</div>
                    <div className={`text-lg font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {profile.interviewTimeline}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Target Companies */}
            <div className="mt-8 pt-8 border-t border-slate-700">
              <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Building className="w-5 h-5" />
                Target Companies ({editedProfile.targetCompanies.length})
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allCompanies.map((company) => (
                  <button
                    key={company}
                    onClick={() => {
                      if (isEditing) {
                        handleToggleCompany(company);
                      }
                    }}
                    disabled={!isEditing}
                    className={`px-4 py-2 rounded-lg border transition text-left ${
                      editedProfile.targetCompanies.includes(company)
                        ? isDark ? 'bg-blue-900/30 border-blue-500 text-blue-300' : 'bg-blue-100 border-blue-500 text-blue-700'
                        : isDark ? 'bg-slate-700 border-slate-600 hover:border-slate-500' : 'bg-slate-100 border-slate-300 hover:border-slate-400'
                    } ${!isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {editedProfile.targetCompanies.includes(company) && '✓ '}
                    {company}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
