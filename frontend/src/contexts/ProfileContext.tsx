import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react";
import { api } from "../services/api";
import type { Profile } from "../types";

interface ProfileContextType {
  profile: Profile | null;
  profiles: Profile[];
  loading: boolean;
  selectProfile: (profile: Profile) => void;
  createProfile: (name: string, theme?: Profile['theme']) => Promise<void>;
  updateProfile: (id: number, name: string) => Promise<void>;
  updateProfileTheme: (id: number, theme: Profile['theme']) => Promise<void>;
  deleteProfile: (id: number) => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfiles = useCallback(async () => {
    try {
      const data = await api<Profile[]>("/profiles");
      setProfiles(data);
      
      const storedId = localStorage.getItem("selectedProfileId");
      if (storedId && data.some(p => p.id === Number(storedId))) {
        setProfile(data.find(p => p.id === Number(storedId)) || data[0]);
      } else if (data.length > 0) {
        setProfile(data[0]);
        localStorage.setItem("selectedProfileId", String(data[0].id));
      } else {
        setProfile(null);
        localStorage.removeItem("selectedProfileId");
      }
    } catch (error) {
      console.error("Failed to load profiles", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfiles();
  }, [refreshProfiles]);

  const selectProfile = (p: Profile) => {
    setProfile(p);
    localStorage.setItem("selectedProfileId", String(p.id));
  };

  const createProfile = async (name: string, theme: Profile['theme'] = 'blue') => {
    await api("/profiles", {
      method: "POST",
      body: JSON.stringify({ name, theme }),
    });
    await refreshProfiles();
  };

  const updateProfile = async (id: number, name: string) => {
    await api(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });
    await refreshProfiles();
  };

  const updateProfileTheme = async (id: number, theme: Profile['theme']) => {
    await api(`/profiles/${id}`, {
      method: "PUT",
      body: JSON.stringify({ theme }),
    });
    await refreshProfiles();
  };

  const deleteProfile = async (id: number) => {
    await api(`/profiles/${id}`, { method: "DELETE" });
    if (profile?.id === id) {
      localStorage.removeItem("selectedProfileId");
      setProfile(null);
    }
    await refreshProfiles();
  };

  return (
    <ProfileContext.Provider value={{ profile, profiles, loading, selectProfile, createProfile, updateProfile, updateProfileTheme, deleteProfile, refreshProfiles }}>
      {children}
    </ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
