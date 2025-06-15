const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Función para normalizar y preservar caracteres acentuados
function normalizeAccentedText(text) {
  if (!text) return text;
  
  // PRIMERO: Sustituir %Ð por corazón
  let cleanedText = text.replace(/%Ð/g, '♥');
  
  // SEGUNDO: Normalizar caracteres acentuados a NFC (forma canónica compuesta)
  // Esto asegura que los caracteres acentuados se representen correctamente
  cleanedText = cleanedText.normalize('NFC');
  
  // TERCERO: Eliminar SOLO emojis problemáticos, preservando acentos
  // Eliminar emojis pictográficos pero mantener caracteres latinos acentuados
  cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, '');
  
  // CUARTO: Eliminar otros símbolos problemáticos pero preservar acentos latinos
  cleanedText = cleanedText.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD10-\uDDFF]/g, '');
  
  // QUINTO: Limpiar espacios múltiples
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
}

async function generateMemorialPDF(res, memorialData, title = "Memorial de Recuerdos", generatedAt) {
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF en formato apaisado con soporte UTF-8
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: {
          top: 40,
          bottom: 40,
          left: 40,
          right: 40
        },
        // Configuraciones importantes para caracteres acentuados
        info: {
          Title: normalizeAccentedText(title),
          Creator: 'Memorial PDF Generator',
          Producer: 'PDFKit'
        }
      });

      doc.pipe(res);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      generateMemorialContent(doc, memorialData, title, generatedAt, pageWidth, pageHeight, margin, contentWidth, contentHeight)
        .then(() => {
          doc.end();
          resolve();
        })
        .catch(reject);

      doc.on('error', (error) => {
        reject(error);
      });

    } catch (error) {
      reject(error);
    }
  });
}

async function generateMemorialContent(doc, memorialData, title, generatedAt, pageWidth, pageHeight, margin, contentWidth, contentHeight) {
  // PORTADA
  generateElegantCoverPage(doc, title, generatedAt, pageWidth, pageHeight, margin, contentWidth, contentHeight);

  // UNA PÁGINA POR CADA FOTO CON COMENTARIO
  for (let index = 0; index < memorialData.length; index++) {
    const item = memorialData[index];
    await generateMemorialPage(doc, item, index + 1, memorialData.length, pageWidth, pageHeight, margin, contentWidth, contentHeight);
  }

  // PÁGINA FINAL
  generateFinalPage(doc, pageWidth, pageHeight, margin, contentWidth, contentHeight);
}

function generateElegantCoverPage(doc, title, generatedAt, pageWidth, pageHeight, margin, contentWidth, contentHeight) {
  // Fondo degradado sutil
  const gradientSteps = 30;
  for (let i = 0; i < gradientSteps; i++) {
    const opacity = 0.08 - (i * 0.002);
    const y = (pageHeight / gradientSteps) * i;
    doc.fillOpacity(opacity)
       .fillColor('#4a5568')
       .rect(0, y, pageWidth, pageHeight / gradientSteps)
       .fill();
  }
  doc.fillOpacity(1);

  // Marco decorativo exterior
  doc.strokeColor('#2d3748')
     .lineWidth(3)
     .rect(20, 20, pageWidth - 40, pageHeight - 40)
     .stroke();

  // Marco decorativo interior
  doc.strokeColor('#4a5568')
     .lineWidth(1.5)
     .rect(35, 35, pageWidth - 70, pageHeight - 70)
     .stroke();

  // Elementos decorativos en las esquinas
  drawCornerDecorations(doc, pageWidth, pageHeight);

  // Título principal centrado - PRESERVANDO ACENTOS
  const centerY = pageHeight / 2;
  const cleanTitle = normalizeAccentedText(title);
  
  // Usar fuente que soporte caracteres acentuados
  doc.fillColor('#2d3748')
     .fontSize(36)
     .font('Helvetica-Bold') // Helvetica soporta caracteres latinos acentuados
     .text(cleanTitle, margin, centerY - 80, {
       width: contentWidth,
       align: 'center'
     });

  // Línea decorativa con ornamento central
  const centerX = pageWidth / 2;
  const lineY = centerY - 30;
  
  // Líneas laterales
  doc.strokeColor('#4a5568')
     .lineWidth(2)
     .moveTo(centerX - 150, lineY)
     .lineTo(centerX - 40, lineY)
     .stroke();
     
  doc.strokeColor('#4a5568')
     .lineWidth(2)
     .moveTo(centerX + 40, lineY)
     .lineTo(centerX + 150, lineY)
     .stroke();

  // Ornamento central
  doc.fillColor('#718096')
     .circle(centerX, lineY, 15)
     .fill();
     
  doc.fillColor('#a0aec0')
     .circle(centerX, lineY, 10)
     .fill();
     
  // Pétalos de la rosa
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const x = centerX + Math.cos(angle) * 8;
    const y = lineY + Math.sin(angle) * 8;
    doc.fillColor('#e2e8f0')
       .circle(x, y, 3)
       .fill();
  }

  // Subtítulo elegante
  doc.fillColor('#4a5568')
     .fontSize(18)
     .font('Helvetica-Oblique')
     .text('En Memoria Eterna', margin, lineY + 40, {
       width: contentWidth,
       align: 'center'
     });

  // Frase conmemorativa
  doc.fillColor('#718096')
     .fontSize(14)
     .font('Helvetica')
     .text('Los recuerdos son el tesoro más preciado que guardamos en el corazón', margin, lineY + 80, {
       width: contentWidth,
       align: 'center',
       lineGap: 2
     });

  // Fecha de generación
  const date = generatedAt ? 
    new Date(generatedAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 
    new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  doc.fillColor('#a0aec0')
     .fontSize(12)
     .font('Helvetica')
     .text(`${date}`, margin, pageHeight - 80, {
       width: contentWidth,
       align: 'center'
     });
}

async function generateMemorialPage(doc, item, pageNumber, totalPages, pageWidth, pageHeight, margin, contentWidth, contentHeight) {
  doc.addPage();

  // Fondo sutil para cada página
  doc.fillColor('#f7fafc')
     .fillOpacity(0.3)
     .rect(0, 0, pageWidth, pageHeight)
     .fill();
  doc.fillOpacity(1);

  // Marco de página
  doc.strokeColor('#e2e8f0')
     .lineWidth(2)
     .rect(margin, margin, contentWidth, contentHeight)
     .stroke();

  // Encabezado de página con número
  doc.fillColor('#4a5568')
     .fontSize(12)
     .font('Helvetica')
     .text(`${pageNumber} de ${totalPages}`, pageWidth - 120, margin + 15);

  // LAYOUT: Área de imagen y texto
  const imageAreaWidth = contentWidth * 0.58;
  const imageAreaHeight = contentHeight - 120;
  const imageX = margin + 25;
  const imageY = margin + 50;

  const textAreaWidth = contentWidth * 0.28;
  const textAreaX = imageX + imageAreaWidth + 50;
  const textAreaY = imageY;

  // Marco decorativo para la imagen
  doc.strokeColor('#cbd5e0')
     .lineWidth(3)
     .rect(imageX - 10, imageY - 10, imageAreaWidth + 20, imageAreaHeight + 20)
     .stroke();

  doc.strokeColor('#e2e8f0')
     .lineWidth(1)
     .rect(imageX - 5, imageY - 5, imageAreaWidth + 10, imageAreaHeight + 10)
     .stroke();

  // Cargar y mostrar imagen
  if (item.file) {
    try {
      const imagePath = path.join(__dirname, '..', 'public', item.file);
      
      if (fs.existsSync(imagePath)) {
        doc.image(imagePath, imageX, imageY, {
          width: imageAreaWidth,
          height: imageAreaHeight,
          fit: [imageAreaWidth, imageAreaHeight],
          align: 'center',
          valign: 'center'
        });
      } else {
        drawElegantImagePlaceholder(doc, imageX, imageY, imageAreaWidth, imageAreaHeight);
      }
    } catch (error) {
      console.log(`Error cargando imagen: ${error.message}`);
      drawElegantImagePlaceholder(doc, imageX, imageY, imageAreaWidth, imageAreaHeight);
    }
  } else {
    drawElegantImagePlaceholder(doc, imageX, imageY, imageAreaWidth, imageAreaHeight);
  }

  // Área de texto
  doc.fillColor('#f7fafc')
     .rect(textAreaX - 15, textAreaY - 15, textAreaWidth + 30, imageAreaHeight + 30)
     .fill();

  doc.strokeColor('#cbd5e0')
     .lineWidth(2)
     .rect(textAreaX - 15, textAreaY - 15, textAreaWidth + 30, imageAreaHeight + 30)
     .stroke();

  // Título/Autor del recuerdo - PRESERVANDO ACENTOS
  if (item.title) {
    const cleanTitle = normalizeAccentedText(item.title);
    doc.fillColor('#2d3748')
       .fontSize(16)
       .font('Helvetica-Bold')
       .text(cleanTitle, textAreaX, textAreaY + 20, {
         width: textAreaWidth,
         align: 'center'
       });
  }

  // Línea decorativa bajo el título
  doc.strokeColor('#a0aec0')
     .lineWidth(1)
     .moveTo(textAreaX + 15, textAreaY + 55)
     .lineTo(textAreaX + textAreaWidth - 15, textAreaY + 55)
     .stroke();

  // Mensaje/Comentario - PRESERVANDO ACENTOS
  if (item.message) {
    const cleanMessage = normalizeAccentedText(item.message);
    const messageY = textAreaY + 75;
    const maxMessageHeight = imageAreaHeight - 160;
    
    // Calcular altura real del mensaje limitada
    const actualMessageHeight = Math.min(
      doc.heightOfString(cleanMessage, {
        width: textAreaWidth - 30,
        lineGap: 4
      }), 
      maxMessageHeight
    );

    // Marco para el mensaje
    doc.fillColor('#ffffff')
       .rect(textAreaX + 8, messageY - 10, textAreaWidth - 16, actualMessageHeight + 20)
       .fill();

    doc.strokeColor('#e2e8f0')
       .lineWidth(1)
       .rect(textAreaX + 8, messageY - 10, textAreaWidth - 16, actualMessageHeight + 20)
       .stroke();

    // Comillas decorativas
    doc.fillColor('#a0aec0')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('"', textAreaX + 15, messageY - 5);

    // Texto del mensaje - PRESERVANDO ACENTOS
    doc.fillColor('#4a5568')
       .fontSize(11)
       .font('Helvetica')
       .text(cleanMessage, textAreaX + 25, messageY + 5, {
         width: textAreaWidth - 40,
         height: actualMessageHeight - 10,
         align: 'justify',
         lineGap: 4,
         ellipsis: true
       });

    // Comillas de cierre
    doc.fillColor('#a0aec0')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('"', textAreaX + textAreaWidth - 25, messageY + actualMessageHeight - 15);
  }

  // Fecha del recuerdo
  if (item.created_at) {
    const dateStr = new Date(item.created_at).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc.fillColor('#718096')
       .fontSize(10)
       .font('Helvetica-Oblique')
       .text(`${dateStr}`, textAreaX, textAreaY + imageAreaHeight - 30, {
         width: textAreaWidth,
         align: 'center'
       });
  }

  // Decoración en la esquina inferior derecha
  drawPageDecoration(doc, pageWidth - 60, pageHeight - 60);
}

function generateFinalPage(doc, pageWidth, pageHeight, margin, contentWidth, contentHeight) {
  doc.addPage();

  // Fondo degradado para página final
  const gradientSteps = 40;
  for (let i = 0; i < gradientSteps; i++) {
    const opacity = 0.05 - (i * 0.001);
    const y = (pageHeight / gradientSteps) * i;
    doc.fillOpacity(opacity)
       .fillColor('#4a5568')
       .rect(0, y, pageWidth, pageHeight / gradientSteps)
       .fill();
  }
  doc.fillOpacity(1);

  // Marco decorativo
  doc.strokeColor('#2d3748')
     .lineWidth(2)
     .rect(margin + 20, margin + 20, contentWidth - 40, contentHeight - 40)
     .stroke();

  const centerY = pageHeight / 2;
  const centerX = pageWidth / 2;

  // Símbolo central
  drawStylizedHeart(doc, centerX, centerY - 50);

  // Mensaje final
  doc.fillColor('#2d3748')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('Siempre en Nuestros Corazones', margin, centerY + 20, {
       width: contentWidth,
       align: 'center'
     });

  // Mensaje de despedida
  doc.fillColor('#4a5568')
     .fontSize(16)
     .font('Helvetica-Oblique')
     .text('Los recuerdos son eternos y el amor nunca muere.\nVives para siempre en cada sonrisa que nos regalaste.', margin, centerY + 70, {
       width: contentWidth,
       align: 'center',
       lineGap: 5
     });

  // Decoraciones florales en las esquinas
  drawFloralCorners(doc, pageWidth, pageHeight);
}

// Funciones auxiliares para decoraciones (sin cambios)
function drawCornerDecorations(doc, pageWidth, pageHeight) {
  const decorSize = 30;
  
  doc.strokeColor('#a0aec0')
     .lineWidth(2)
     .moveTo(50, 50)
     .lineTo(50 + decorSize, 50)
     .moveTo(50, 50)
     .lineTo(50, 50 + decorSize)
     .stroke();

  doc.moveTo(pageWidth - 50, 50)
     .lineTo(pageWidth - 50 - decorSize, 50)
     .moveTo(pageWidth - 50, 50)
     .lineTo(pageWidth - 50, 50 + decorSize)
     .stroke();

  doc.moveTo(50, pageHeight - 50)
     .lineTo(50 + decorSize, pageHeight - 50)
     .moveTo(50, pageHeight - 50)
     .lineTo(50, pageHeight - 50 - decorSize)
     .stroke();

  doc.moveTo(pageWidth - 50, pageHeight - 50)
     .lineTo(pageWidth - 50 - decorSize, pageHeight - 50)
     .moveTo(pageWidth - 50, pageHeight - 50)
     .lineTo(pageWidth - 50, pageHeight - 50 - decorSize)
     .stroke();
}

function drawElegantImagePlaceholder(doc, x, y, width, height) {
  // Fondo degradado
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const opacity = 0.1 + (i / steps) * 0.1;
    doc.fillOpacity(opacity)
       .fillColor('#e2e8f0')
       .rect(x, y + (height / steps) * i, width, height / steps)
       .fill();
  }
  doc.fillOpacity(1);

  // Marco decorativo
  doc.strokeColor('#cbd5e0')
     .lineWidth(2)
     .rect(x + 20, y + 20, width - 40, height - 40)
     .stroke();

  // Icono central elegante
  const iconSize = Math.min(80, width * 0.3, height * 0.3);
  const iconX = x + (width - iconSize) / 2;
  const iconY = y + (height - iconSize) / 2;

  doc.fillColor('#f7fafc')
     .circle(iconX + iconSize/2, iconY + iconSize/2, iconSize/2)
     .fill();
     
  doc.strokeColor('#cbd5e0')
     .lineWidth(2)
     .circle(iconX + iconSize/2, iconY + iconSize/2, iconSize/2)
     .stroke();

  doc.strokeColor('#a0aec0')
     .lineWidth(3)
     .rect(iconX + 15, iconY + 15, iconSize - 30, (iconSize - 30) * 0.7)
     .stroke();

  doc.fillColor('#ffd93d')
     .circle(iconX + 25, iconY + 25, 8)
     .fill();

  doc.fillColor('#cbd5e0')
     .polygon([iconX + 15, iconY + iconSize - 15], 
              [iconX + 40, iconY + 40], 
              [iconX + 65, iconY + iconSize - 15])
     .fill();
     
}

function drawStylizedHeart(doc, centerX, centerY) {
  doc.fillColor('#e53e3e')
     .fillOpacity(0.8);

  doc.moveTo(centerX, centerY + 20)
     .bezierCurveTo(centerX - 30, centerY - 10, centerX - 30, centerY - 30, centerX - 15, centerY - 30)
     .bezierCurveTo(centerX - 7, centerY - 30, centerX, centerY - 22, centerX, centerY - 15)
     .bezierCurveTo(centerX, centerY - 22, centerX + 7, centerY - 30, centerX + 15, centerY - 30)
     .bezierCurveTo(centerX + 30, centerY - 30, centerX + 30, centerY - 10, centerX, centerY + 20)
     .fill();

  doc.fillOpacity(1);
}

function drawPageDecoration(doc, x, y) {
  doc.fillColor('#e2e8f0')
     .circle(x, y, 15)
     .fill();
     
  doc.fillColor('#cbd5e0')
     .circle(x, y, 10)
     .fill();
     
  doc.fillColor('#a0aec0')
     .circle(x, y, 5)
     .fill();
}

function drawFloralCorners(doc, pageWidth, pageHeight) {
  const petalSize = 8;
  const positions = [
    [80, 80],
    [pageWidth - 80, 80],
    [80, pageHeight - 80],
    [pageWidth - 80, pageHeight - 80]
  ];

  positions.forEach(([x, y]) => {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const petalX = x + Math.cos(angle) * 12;
      const petalY = y + Math.sin(angle) * 12;
      
      doc.fillColor('#e2e8f0')
         .fillOpacity(0.7)
         .circle(petalX, petalY, petalSize)
         .fill();
    }
    
    doc.fillColor('#ffd93d')
       .fillOpacity(1)
       .circle(x, y, 5)
       .fill();
  });
}

module.exports = {
  generateMemorialPDF
};
