import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Box, TableCell } from '@mui/material';

// רכיב תא שניתן לגרור ממנו
export const DraggableCell = ({ booking, roomId, date, children, onClick, sx }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'booking',
    item: { bookingId: booking._id, roomId, date, booking },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <TableCell
      ref={drag}
      onClick={onClick}
      align="center"
      sx={{
        ...sx,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      {children}
    </TableCell>
  );
};

// רכיב תא שניתן להשמיט עליו
export const DroppableCell = ({ roomId, date, children, onDrop, canDrop: canDropProp, onClick, sx }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'booking',
    drop: (item) => {
      if (onDrop) {
        onDrop(item, roomId, date);
      }
    },
    canDrop: () => canDropProp !== false,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });

  return (
    <TableCell
      ref={drop}
      onClick={onClick}
      align="center"
      sx={{
        ...sx,
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {children}
      {isOver && canDrop && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 255, 0, 0.1)',
            border: '2px dashed green',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </TableCell>
  );
}; 