const express = require('express');
const { generateMemorialPDF } = require('../utils/pdfGenerator');
const router = express.Router();

router.post('/generate-memorial-pdf', async (req, res) => {
  try {
    const { data, title, generatedAt } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ 
        error: 'Datos del memorial requeridos' 
      });
    }

    // Configurar headers para descarga de PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=memorial-${Date.now()}.pdf`
    );

    // Generar y enviar el PDF
    await generateMemorialPDF(res, data, title, generatedAt);
    
  } catch (error) {
    console
    console.error('Error generando PDF:', error);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error.message 
      });
    }
  }
});

module.exports = router;
