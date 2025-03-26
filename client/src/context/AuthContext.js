import React, { createContext, useState, useEffect, useContext } from 'react';
import jwt_decode from 'jwt-decode';
import axios from 'axios';

// יצירת קונטקסט
export const AuthContext = createContext();

// הוק שימושי לגישה לקונטקסט
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // טעינת נתוני משתמש מ-localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתוני משתמש מ-localStorage:', error);
    }
  }, []);

  // הגדרת טוקן בכותרות הבקשה
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // לוודא שיש קונסול.לוג כדי לבדוק
      console.log('Authorization header set:', `Bearer ${token}`);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      console.log('Authorization header removed');
    }
  }, [token]);

  // בדיקת תוקף הטוקן בטעינה
  useEffect(() => {
    const checkToken = async () => {
      if (token) {
        try {
          // במקום לבדוק את הטוקן, נשלח בקשה לשרת
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data && response.data.success) {
            setUser(response.data.user);
          } else {
            logout();
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
      
      // שמירת הטוקן ופרטי המשתמש ב-localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
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
    localStorage.removeItem('user');
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