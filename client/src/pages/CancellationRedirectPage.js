import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const CancellationRedirectPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("דף מעבר נטען עם ID:", id);
    
    // מעבר לדף הביטול עם המזהה
    if (id) {
      // מתן זמן קצר לפני ההפניה
      setTimeout(() => {
        navigate(`/cancel-booking/${id}`);
      }, 1000);
    }
  }, [id, navigate]);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', p: 3 }}>
      <CircularProgress size={60} sx={{ mb: 3 }} />
      <Typography variant="h6">מעבר לדף ביטול ההזמנה...</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
        אנא המתן...
      </Typography>
    </Box>
  );
};

export default CancellationRedirectPage; 