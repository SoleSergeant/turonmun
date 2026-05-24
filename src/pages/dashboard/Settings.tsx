import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Palette,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Camera,
  Mail,
  Phone,
  Shield,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    // Profile settings
    fullName: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Passionate MUN delegate with 3 years of experience',
    
    // Security settings
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    committeeUpdates: true,
    systemAlerts: true,
    marketingEmails: false,
    
    // Appearance settings
    darkMode: true,
    language: 'en',
    timezone: 'UTC-5',
    soundEnabled: true,
    
    // Privacy settings
    profileVisibility: 'delegates',
    showEmail: false,
    showPhone: false,
    dataSharing: false
  });

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'privacy', name: 'Privacy', icon: Shield }
  ];

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Mock save functionality
  };

  const handleDownloadData = () => {
    console.log('Downloading user data...');
    // Mock download functionality
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      console.log('Deleting account...');
      // Mock delete functionality
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
          Settings
        </h1>
        <p className="text-white/70">
          Manage your account preferences and dashboard settings
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="glass-card p-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gold-400/20 text-gold-300 shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Settings Content */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <div className="glass-card p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                  
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-gold-400 to-gold-500 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <motion.button
                        className="flex items-center space-x-2 bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-lg transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Camera className="h-4 w-4" />
                        <span>Change Photo</span>
                      </motion.button>
                      <p className="text-white/60 text-sm mt-1">JPG, PNG up to 5MB</p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={settings.fullName}
                        onChange={(e) => handleSettingChange('fullName', e.target.value)}
                        className="w-full glass-panel px-4 py-2 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => handleSettingChange('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
                        <input
                          type="tel"
                          value={settings.phone}
                          onChange={(e) => handleSettingChange('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-2 glass-panel text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Bio</label>
                      <textarea
                        value={settings.bio}
                        onChange={(e) => handleSettingChange('bio', e.target.value)}
                        rows={3}
                        className="w-full glass-panel px-4 py-2 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
                  
                  {/* Change Password */}
                  <div className="glass-panel p-4 rounded-lg">
                    <h3 className="text-white font-medium mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={settings.currentPassword}
                            onChange={(e) => handleSettingChange('currentPassword', e.target.value)}
                            className="w-full pr-10 glass-panel px-4 py-2 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">New Password</label>
                          <input
                            type="password"
                            value={settings.newPassword}
                            onChange={(e) => handleSettingChange('newPassword', e.target.value)}
                            className="w-full glass-panel px-4 py-2 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={settings.confirmPassword}
                            onChange={(e) => handleSettingChange('confirmPassword', e.target.value)}
                            className="w-full glass-panel px-4 py-2 text-white placeholder-white/50 border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="glass-panel p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                        <p className="text-white/60 text-sm">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorEnabled}
                          onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                      { key: 'pushNotifications', label: 'Push Notifications', description: 'Browser push notifications' },
                      { key: 'smsNotifications', label: 'SMS Notifications', description: 'Text message notifications' },
                      { key: 'committeeUpdates', label: 'Committee Updates', description: 'Updates from your committee chairs' },
                      { key: 'systemAlerts', label: 'System Alerts', description: 'Important system announcements' },
                      { key: 'marketingEmails', label: 'Marketing Emails', description: 'Promotional content and updates' }
                    ].map((item) => (
                      <div key={item.key} className="glass-panel p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium">{item.label}</h3>
                            <p className="text-white/60 text-sm">{item.description}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings[item.key as keyof typeof settings] as boolean}
                              onChange={(e) => handleSettingChange(item.key, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Appearance & Language</h2>
                  
                  <div className="space-y-4">
                    {/* Theme */}
                    <div className="glass-panel p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">Dark Mode</h3>
                          <p className="text-white/60 text-sm">Use dark theme for better night viewing</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Sun className="h-4 w-4 text-white/50" />
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.darkMode}
                              onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                          </label>
                          <Moon className="h-4 w-4 text-white/50" />
                        </div>
                      </div>
                    </div>

                    {/* Sound */}
                    <div className="glass-panel p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-medium">Sound Effects</h3>
                          <p className="text-white/60 text-sm">Play sounds for notifications and interactions</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <VolumeX className="h-4 w-4 text-white/50" />
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.soundEnabled}
                              onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                          </label>
                          <Volume2 className="h-4 w-4 text-white/50" />
                        </div>
                      </div>
                    </div>

                    {/* Language & Timezone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Language</label>
                        <select
                          value={settings.language}
                          onChange={(e) => handleSettingChange('language', e.target.value)}
                          className="w-full glass-panel px-4 py-2 text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                        >
                          <option value="en">English</option>
                          <option value="es">Español</option>
                          <option value="fr">Français</option>
                          <option value="de">Deutsch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => handleSettingChange('timezone', e.target.value)}
                          className="w-full glass-panel px-4 py-2 text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                        >
                          <option value="UTC-8">Pacific Time (UTC-8)</option>
                          <option value="UTC-5">Eastern Time (UTC-5)</option>
                          <option value="UTC+0">GMT (UTC+0)</option>
                          <option value="UTC+1">Central European Time (UTC+1)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Privacy & Data</h2>
                  
                  <div className="space-y-4">
                    {/* Profile Visibility */}
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="text-white font-medium mb-3">Profile Visibility</h3>
                      <select
                        value={settings.profileVisibility}
                        onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                        className="w-full glass-panel px-4 py-2 text-white border-white/20 focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/50 transition-all rounded-lg"
                      >
                        <option value="public">Public - Visible to everyone</option>
                        <option value="delegates">Delegates Only - Visible to other delegates</option>
                        <option value="private">Private - Only visible to you</option>
                      </select>
                    </div>

                    {/* Contact Information */}
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="text-white font-medium mb-3">Contact Information Visibility</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Show Email Address</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.showEmail}
                              onChange={(e) => handleSettingChange('showEmail', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/80">Show Phone Number</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.showPhone}
                              onChange={(e) => handleSettingChange('showPhone', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div className="glass-panel p-4 rounded-lg">
                      <h3 className="text-white font-medium mb-3">Data Management</h3>
                      <div className="space-y-3">
                        <motion.button
                          onClick={handleDownloadData}
                          className="flex items-center space-x-2 w-full glass-panel px-4 py-2 text-white hover:bg-white/20 transition-colors rounded-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Download className="h-4 w-4" />
                          <span>Download My Data</span>
                        </motion.button>
                        
                        <motion.button
                          onClick={handleDeleteAccount}
                          className="flex items-center space-x-2 w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 px-4 py-2 text-red-400 transition-colors rounded-lg"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Account</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <motion.button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
