// @route   PUT /api/users/:id/super-admin
// @desc    הגדר או בטל הרשאות אדמין ראשי
// @access  Private/Admin
router.put('/:id/super-admin', [protect, admin], async (req, res) => {
  try {
    const { superAdminPassword } = req.body;
    
    // בדיקת סיסמא
    if (superAdminPassword !== process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'סיסמה שגויה'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'משתמש לא נמצא'
      });
    }
    
    // הגדרת משתמש כאדמין ראשי
    user.isSuperAdmin = !user.isSuperAdmin;
    await user.save();
    
    res.json({
      success: true,
      isSuperAdmin: user.isSuperAdmin,
      message: user.isSuperAdmin ? 
        `המשתמש ${user.name} הוגדר כאדמין ראשי` : 
        `הרשאות אדמין ראשי הוסרו מהמשתמש ${user.name}`
    });
  } catch (error) {
    console.error('שגיאה בעדכון הרשאות אדמין ראשי:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאת שרת',
      error: error.message
    });
  }
}); 