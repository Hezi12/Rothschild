import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// יצירת קונטקסט
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // הגדרת טוקן בכותרות הבקשה
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // בדיקת תוקף הטוקן בטעינה
  useEffect(() => {
    const checkToken = async () => {
      if (token) {
        try {
          // בדיקת תוקף הטוקן
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // הטוקן פג תוקף
            logout();
          } else {
            // קבלת פרטי המשתמש מהשרת
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`);
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('שגיאה באימות המשתמש:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkToken();
  }, [token]);

  // התחברות
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      
      // שמירת הטוקן ב-localStorage
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      return true;
    } catch (error) {
      console.error('שגיאה בהתחברות:', error);
      setError(error.response?.data?.message || 'שגיאה בהתחברות');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // התנתקות
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // בדיקה אם המשתמש מחובר
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // בדיקה אם המשתמש הוא מנהל
  const isAdmin = () => {
    return isAuthenticated() && user.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 