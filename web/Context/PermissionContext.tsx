"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import { getMyPermissions } from "../services/authService";
import { getScreens } from "../services/userService";
import { installSessionGuard } from "../utils/sessionGuard";

type Screen = {
  id: string;
  name: string;
};

type PermissionContextType = {
  permissions: string[];
  screens: Screen[];
  loading: boolean;
  userId: string | undefined;
  hasPermission: (screenId: string) => boolean;
  getScreenId: (name: string) => string | undefined;
  getScreenName: (id: string) => string | undefined;
  reloadPermissions: () => Promise<void>;
};

const PermissionContext =
  createContext<PermissionContextType | null>(null);

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const loadPermissions = async () => {
    try {
      setLoading(true);
      const cookieUserId = Cookies.get("userId");
      setUserId(cookieUserId);
      const [permissionsData, screensData] = await Promise.all([
        getMyPermissions(),
        getScreens(),
      ]);

      setPermissions(permissionsData);
      setScreens(screensData);
    } catch (error) {
      console.error(error);
      setPermissions([]);
      setScreens([]);
    } finally {
      setLoading(false);
    }
  };

  // Este provider envuelve toda la app, asi que es el lugar correcto
  // para instalar el guard de sesion una sola vez
  useEffect(() => {
    installSessionGuard();
  }, []);

  const hasPermission = (screenId: string) => {
    return permissions.includes(screenId);
  };

  const getScreenId = (name: string) => {
    return screens.find(
      (x) => x.name.toLowerCase() === name.toLowerCase()
    )?.id;
  };

  const getScreenName = (id: string) => {
    return screens.find(
      (x) => x.id === id
    )?.name;
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        screens,
        loading,
        userId,
        hasPermission,
        getScreenId,
        getScreenName,
        reloadPermissions: loadPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error(
      "usePermissions debe usarse dentro de PermissionProvider"
    );
  }

  return context;
}