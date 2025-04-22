import React from 'react';
import { IconButton, styled } from '@mui/material';

// קומפוננטת אייקון בלוח
const StyledIconButton = styled(IconButton)(({ theme }) => ({
  width: '18px',
  height: '18px',
  padding: '1px',
  '& .MuiSvgIcon-root': {
    fontSize: '0.8rem',
  }
}));

const CellIconButton = ({ children, ...props }) => {
  return (
    <StyledIconButton size="small" {...props}>
      {children}
    </StyledIconButton>
  );
};

export default CellIconButton; 