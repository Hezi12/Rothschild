import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const RoomDetailsPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const { userInfo } = useSelector(state => state.auth);

  useEffect(() => {
    if (id) {
      fetchRoom();
    }
  }, [id]);

  const fetchRoom = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/rooms/${id}`, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setRoom(response.data.data);
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי החדר:', error);
      toast.error('אירעה שגיאה בטעינת פרטי החדר');
    } finally {
      setLoading(false);
    }
  };
  
  const deleteRoom = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק חדר זה? פעולה זו אינה הפיכה.')) {
      try {
        setLoading(true);
        const response = await axios.delete(
          `${process.env.REACT_APP_API_URL}/rooms/${id}`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          toast.success('החדר נמחק בהצלחה');
          // ניתוב בחזרה לדף החדרים
          window.location.href = '/admin/rooms';
        }
      } catch (error) {
        console.error('שגיאה במחיקת החדר:', error);
        toast.error(error.response?.data?.message || 'אירעה שגיאה במחיקת החדר');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // פונקציה למחיקת כל החסימות של החדר
  const deleteAllBlockedDates = async () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את כל החסימות של חדר זה? פעולה זו אינה הפיכה.')) {
      try {
        setLoading(true);
        const response = await axios.delete(
          `${process.env.REACT_APP_API_URL}/rooms/${id}/blocked-dates`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          toast.success(response.data.message);
          // רענון נתוני החדר
          fetchRoom();
        }
      } catch (error) {
        console.error('שגיאה במחיקת החסימות:', error);
        toast.error(error.response?.data?.message || 'אירעה שגיאה במחיקת החסימות');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container py-4">
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">טוען...</span>
          </div>
        </div>
      ) : (
        <>
          {room && (
            <div className="room-details">
              <h1 className="mb-4">פרטי חדר {room.roomNumber}</h1>
              
              {userInfo && userInfo.isAdmin && (
                <div className="admin-actions mb-4">
                  <h2>פעולות מנהל</h2>
                  <div className="d-flex gap-2">
                    <Button variant="danger" onClick={deleteRoom} disabled={loading}>
                      מחק חדר
                    </Button>
                    <Button variant="warning" onClick={deleteAllBlockedDates} disabled={loading}>
                      מחק כל החסימות של חדר זה
                    </Button>
                  </div>
                </div>
              )}
              
              {/* תוכן פרטי החדר */}
              <div className="room-content">
                {/* כאן יוצג תוכן החדר עצמו */}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoomDetailsPage; 