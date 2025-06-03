const pool = require("../config/db");
const queries = require("../queries/formQueries");
const cloudinary = require('cloudinary').v2;
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');
const axios = require('axios');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const formData = async (req, res) => {
    const {
        nama_pemilik,
        waktu_pelaksanaan,
        desa,
        kecamatan,
        kab_kota,
        provinsi,
        luas_lahan,
        jenis_tanaman,
        masa_panen,
        sumber_air,
        jarak_sumber_air,
        ketersediaan_air,
        metode_pengairan,
        titik_koordinat_id,
        pelaksana_survei,
        cloudinary_ids,
        dokumentasi_utara,
        dokumentasi_timur,
        dokumentasi_selatan,
        dokumentasi_barat,
        user_id
      } = req.body;

    try {
      const result = await pool.query(queries.formData, [
        nama_pemilik, waktu_pelaksanaan, desa, kecamatan, kab_kota, provinsi,
        luas_lahan, jenis_tanaman, masa_panen, sumber_air, jarak_sumber_air,
        ketersediaan_air, metode_pengairan, titik_koordinat_id, pelaksana_survei, JSON.stringify(cloudinary_ids),
        dokumentasi_utara, dokumentasi_timur, dokumentasi_selatan, dokumentasi_barat,
        user_id
      ]);
  
      res
        .status(201)
        .json({
          success: true,
          message: "Data form berhasil disimpan",
          data: result.rows[0],
        });
    } catch (error) {
      console.error("Error menyimpan data form:", error);
      res.status(500).json({ success: false, message: "Gagal menyimpan data" });
    }
  };

  const getFormByUserId = async (req, res) => {
    const { user_id } = req.params; 
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'user_id harus disertakan' });
    }
  
    try {
      const result = await pool.query(queries.ambilForm, [user_id]
      );
  
      res.status(200).json({
        success: true,
        message: 'Data form berhasil diambil',
        data: result.rows,
      });
    } catch (error) {
      console.error('Error mengambil data form:', error);
      res.status(500).json({ success: false, message: error });
    }
  };

const hapusForm = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM form_sawah WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data form tidak ditemukan',
      });
    }
    const data = result.rows[0];
    const cloudinaryIds = (data.cloudinary_ids);

    await Promise.all(cloudinaryIds.map(id => cloudinary.uploader.destroy(id)));
    await pool.query(queries.hapusForm, [id]);

    res.status(200).json({
      success: true,
      message: 'Data form berhasil dihapus',
    });
  } catch (error) {
    console.error('Error menghapus data form:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data form',
    });
  }
};

const updateForm = async (req, res) => {
  const { id } = req.params;
  const {
    nama_pemilik,
    waktu_pelaksanaan,
    desa,
    kecamatan,
    kab_kota,
    provinsi,
    luas_lahan,
    jenis_tanaman,
    masa_panen,
    sumber_air,
    jarak_sumber_air,
    ketersediaan_air,
    metode_pengairan,
    titik_koordinat_id,
    pelaksana_survei,
    cloudinary_ids,
    dokumentasi_utara,
    dokumentasi_timur,
    dokumentasi_selatan,
    dokumentasi_barat,
    user_id
  } = req.body;

  try {
    // Assuming your queries object has an updateForm query
    const result = await pool.query(queries.updateForm, [
      nama_pemilik, 
      waktu_pelaksanaan, 
      desa, 
      kecamatan, 
      kab_kota, 
      provinsi,
      luas_lahan, 
      jenis_tanaman, 
      masa_panen, 
      sumber_air, 
      jarak_sumber_air,
      ketersediaan_air, 
      metode_pengairan, 
      titik_koordinat_id, 
      pelaksana_survei, 
      JSON.stringify(cloudinary_ids),
      dokumentasi_utara, 
      dokumentasi_timur, 
      dokumentasi_selatan, 
      dokumentasi_barat,
      user_id,
      id // This is the id from the route params that identifies which record to update
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Data form tidak ditemukan" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Data form berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error memperbarui data form:", error);
    res.status(500).json({ success: false, message: "Gagal memperbarui data" });
  }
};

const generatePdf = async (req, res) => {
  const { id } = req.params;

  try {
    const formResult = await pool.query(queries.getFormDataById, [id]);
    if (formResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }

    const form = formResult.rows[0];
    const titikIds = form.titik_koordinat_id;
    const titikResult = await pool.query(queries.getTitikByIds, [titikIds]);
    const titik = titikResult.rows;
    const orderedPoints = titikIds.map(id => titik.find(t => t.id_titik === id));
    
    const images = [
      { url: form.dokumentasi_utara, direction: 'Utara' },
      { url: form.dokumentasi_timur, direction: 'Timur' },
      { url: form.dokumentasi_selatan, direction: 'Selatan' },
      { url: form.dokumentasi_barat, direction: 'Barat' }
    ];

    const pdfDoc = await PDFDocument.create();
    
    // Set A4 dimensions
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 20;
    const usableWidth = pageWidth - (margin * 2);
    
    // Embed fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Create the first page
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;
    
    // Function to add a new page when needed
    const addNewPageIfNeeded = (requiredHeight) => {
      // If we don't have enough space for the next element
      if (currentY - requiredHeight < margin) {
        // Create a new page
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
        
        // Draw border for the new page
        page.drawRectangle({
          x: margin,
          y: margin,
          width: usableWidth,
          height: pageHeight - (margin * 2),
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
        
        return true;
      }
      return false;
    };
    
    // 1. TITLE SECTION
    const titleHeight = 40;
    const titleFramePadding = 10;

    page.drawRectangle({
      x: margin,
      y: currentY - titleHeight - titleFramePadding,
      width: usableWidth,
      height: titleHeight + (titleFramePadding * 2),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });
    
    // Function to center text horizontally
    const centerText = (text, font, fontSize, pageWidth) => {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const centerX = (pageWidth / 2) - (textWidth / 2);
      return centerX;
    };

    const titleText = 'PEMETAAN DETAIL POLIGON SAWAH';
    const titleX = centerText(titleText, boldFont, 14, pageWidth);
    page.drawText(titleText, {
      x: titleX,
      y: currentY - 15,
      size: 18,
      font: boldFont,
    });

    const ownerText = form.nama_pemilik.toUpperCase();
    const ownerX = centerText(ownerText, boldFont, 14, pageWidth);
    page.drawText(ownerText, {
      x: ownerX,
      y: currentY - 40,
      size: 18,
      font: boldFont,
    });
    
    currentY -= titleHeight + (titleFramePadding * 2);

    // 2. MAP SECTION
    const mapHeight = 340;
    
    // Check if we need a new page for the map
    addNewPageIfNeeded(mapHeight);

    page.drawRectangle({
      x: margin,
      y: currentY - mapHeight,
      width: usableWidth,
      height: mapHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });
    
    // Generate polygon visualization
    const polygonImage = await drawPolygon(orderedPoints, usableWidth, mapHeight);
    const polygonImageBytes = await fs.readFile(polygonImage);
    const polygonPdfImage = await pdfDoc.embedPng(polygonImageBytes);
    
    // Draw polygon
    page.drawImage(polygonPdfImage, {
      x: margin,
      y: currentY - mapHeight,
      width: usableWidth,
      height: mapHeight,
    });
    
    // Draw north arrow
    const arrowX = pageWidth - margin - 40;
    const arrowY = currentY - 15;
    
    page.drawText('U', {
      x: arrowX,
      y: arrowY - 9,
      size: 14,
      font: boldFont
    });
    
    // Draw arrow pointing up
    page.drawLine({
      start: { x: arrowX + 5, y: arrowY - 15 },
      end: { x: arrowX + 5, y: arrowY - 40 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    page.drawLine({
      start: { x: arrowX, y: arrowY - 20 },
      end: { x: arrowX + 5, y: arrowY - 15 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    page.drawLine({
      start: { x: arrowX + 10, y: arrowY - 20 },
      end: { x: arrowX + 5, y: arrowY - 15 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    currentY -= mapHeight;
    
    // 3. LEGEND SECTION
    currentY -= 20;
    const legendheight = 380;
    const lengendpadding = 10;

    page.drawRectangle({
      x: margin,
      y: currentY - legendheight - lengendpadding,
      width: usableWidth,
      height: legendheight + (lengendpadding * 2),
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    currentY -= 15
    
    page.drawText('LEGENDA', {
      x: margin + 15,
      y: currentY,
      size: 12,
      font: boldFont,
    });
    
    currentY -= 20;
    
    // Set variables for legend content positioning
    const lineSpacing = 20;
    const labelColumn = margin + 15;
    const colonPosition = margin + 130;
    const valueColumn = margin + 150;
    
    // Function to draw a legend item
    const drawLegendItem = (label, value) => {
      // Check if we need a new page before drawing this item
      if (addNewPageIfNeeded(lineSpacing)) {
        // After adding a new page, we may want to add a section header
        page.drawText('LEGENDA (lanjutan)', {
          x: margin + 15,
          y: currentY - 25,
          size: 12,
          font: boldFont,
        });
        currentY -= 50; // Space after the header
      }
      
      if (label) {
        page.drawText(label, {
          x: labelColumn,
          y: currentY,
          size: 10,
          font: boldFont,
        });
      }
      
      if (value !== '') {
        page.drawText(':', {
          x: colonPosition,
          y: currentY,
          size: 10,
          font: regularFont,
        });
        
        page.drawText(value, {
          x: valueColumn,
          y: currentY,
          size: 10,
          font: regularFont,
        });
      }
      
      currentY -= lineSpacing;
    };

    const waktuPelaksanaan = new Date(form.waktu_pelaksanaan);
    const formattedDate = `${waktuPelaksanaan.getDate()} ${getMonthName(waktuPelaksanaan.getMonth())} ${waktuPelaksanaan.getFullYear()}`;
    
    // Draw all legend items
    drawLegendItem('Nama Kegiatan', 'Pemetaan Detail Poligon Sawah');    
    drawLegendItem('Waktu Pelaksanaan', formattedDate);
    drawLegendItem('Nama Pemilik', form.nama_pemilik);
    
    page.drawText('Informasi Wilayah', {
      x: labelColumn,
      y: currentY,
      size: 10,
      font: boldFont,
    });
    
    // Check space for region info
    const regionInfoHeight = lineSpacing * 4;
    addNewPageIfNeeded(regionInfoHeight);
    
    // Desa - on the same line as "Informasi Wilayah"
    page.drawText(':', {
      x: colonPosition,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    
    page.drawText('Desa ' + form.desa, {
      x: valueColumn,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    currentY -= lineSpacing;
    
    // Kecamatan - with proper indentation
    page.drawText(':', {
      x: colonPosition,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    
    page.drawText('Kecamatan ' + form.kecamatan, {
      x: valueColumn,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    currentY -= lineSpacing;
    
    // Kabupaten - with proper indentation
    page.drawText(':', {
      x: colonPosition,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    
    page.drawText('Kabupaten ' + form.kab_kota, {
      x: valueColumn,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    currentY -= lineSpacing;
    
    // Provinsi - with proper indentation
    page.drawText(':', {
      x: colonPosition,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    
    page.drawText('Provinsi ' + form.provinsi, {
      x: valueColumn,
      y: currentY,
      size: 10,
      font: regularFont,
    });
    currentY -= lineSpacing;
    
    drawLegendItem('Luas Lahan', form.luas_lahan + ' meter²');
    // drawLegendItem('Jenis Tanah', 'Regosol');
    drawLegendItem('Jenis Tanaman', form.jenis_tanaman);
    drawLegendItem('Masa Panen', form.masa_panen);
    drawLegendItem('Sumber Air', form.sumber_air);
    drawLegendItem('Jarak dari Sumber Air', form.jarak_sumber_air + ' meter');
    drawLegendItem('Ketersediaan Air', form.ketersediaan_air);
    drawLegendItem('Metode Pengairan', form.metode_pengairan);
    
    /// Pelaksana survei
page.drawText('Pelaksana Survei', {
  x: labelColumn,
  y: currentY,
  size: 10,
  font: boldFont,
});

if (Array.isArray(form.pelaksana_survei)) {
  const namesPerColumn = 3;
  const total = form.pelaksana_survei.length;
  const column1 = form.pelaksana_survei.slice(0, namesPerColumn);
  const column2 = form.pelaksana_survei.slice(namesPerColumn);

  const maxRows = Math.max(column1.length, column2.length);
  const surveyorsHeight = lineSpacing * maxRows;
  addNewPageIfNeeded(surveyorsHeight);

  const column2X = valueColumn + 200; // Geser kolom 2 ke kanan (atur sesuai lebar halaman)

  column1.forEach((name, index) => {
    if (index === 0) {
      page.drawText(':', {
        x: colonPosition,
        y: currentY,
        size: 10,
        font: regularFont,
      });
    }

    page.drawText(`${index + 1}. ${name}`, {
      x: valueColumn,
      y: currentY,
      size: 10,
      font: regularFont,
    });

    currentY -= lineSpacing;
  });

  // Reset Y untuk kolom 2
  let column2Y = currentY + (lineSpacing * column2.length); // Kembali ke posisi atas kolom 1

  column2.forEach((name, index) => {
    page.drawText(`${index + namesPerColumn + 1}. ${name}`, {
      x: column2X,
      y: column2Y,
      size: 10,
      font: regularFont,
    });

    column2Y -= lineSpacing;
  });

  // Pastikan currentY tetap yang paling rendah (agar tidak tumpang tindih)
  currentY = Math.min(currentY, column2Y);
}

    
    // 4. DOCUMENTATION SECTION
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    currentY = pageHeight - margin; 
    
    // Add documentation title at the top
    page.drawText('DOKUMENTASI', {
      x: margin + 15,
      y: currentY - 30,
      size: 10,
      font: boldFont,
    });
    
    currentY = currentY - 50; 
    
    const gridColumns = 2;
    const gridRows = 2;
    const photoWidth = usableWidth / gridColumns;
    const photoHeight = 300; 
    const cellPadding = 5;
    
    const totalGridHeight = photoHeight * gridRows;
    
    // Draw the photo grid
    if (images && images.length > 0) {
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridColumns; col++) {
          const i = row * gridColumns + col;
          
          // Skip if we don't have this many images
          if (i >= images.length) continue;
          
          const x = margin + (col * photoWidth);
          const y = currentY - (row * photoHeight);
          
          // Draw cell borders
          page.drawRectangle({
            x: x,
            y: y - photoHeight,
            width: photoWidth,
            height: photoHeight,
            borderColor: rgb(0, 0, 0),
            borderWidth: 1,
          });
          
          // Draw label for the photo in the center top of each cell
          page.drawText(`Tampak ${images[i].direction}`, {
            x: x + (photoWidth / 2) - 40,
            y: y - 20,
            size: 10,
            font: boldFont,
          });
          
          // Calculate image dimensions to maintain aspect ratio and fit properly
          const imageBox = {
            x: x + cellPadding,
            y: y - photoHeight + cellPadding,
            width: photoWidth - (cellPadding * 2),
            height: photoHeight - 30 - (cellPadding * 2) 
          };
          
          // Draw the image from Cloudinary (if available)
          try {
            if (images[i] && images[i].url) {
              const response = await axios.get(images[i].url, { responseType: 'arraybuffer' });
              const imageBytes = response.data;
              
              // Embed the image based on its format
              let pdfImage;
              if (images[i].url.toLowerCase().endsWith('.png')) {
                pdfImage = await pdfDoc.embedPng(imageBytes);
              } else {
                // Default to JPG for all other formats
                pdfImage = await pdfDoc.embedJpg(imageBytes);
              }
              
              // Calculate image dimensions to maintain aspect ratio
              const { width: imgWidth, height: imgHeight } = pdfImage.size();
              const scaleFactor = Math.min(
                imageBox.width / imgWidth,
                imageBox.height / imgHeight
              );
              
              const scaledWidth = imgWidth * scaleFactor;
              const scaledHeight = imgHeight * scaleFactor;
              
              // Center the image in the cell
              const xOffset = (imageBox.width - scaledWidth) / 2;
              const yOffset = (imageBox.height - scaledHeight) / 2;
              
              page.drawImage(pdfImage, {
                x: imageBox.x + xOffset,
                y: imageBox.y + yOffset,
                width: scaledWidth,
                height: scaledHeight,
              });
            }
          } catch (error) {
            console.error(`Error embedding image ${i}:`, error);
            
            // Draw a placeholder if image can't be embedded
            page.drawRectangle({
              x: imageBox.x,
              y: imageBox.y,
              width: imageBox.width,
              height: imageBox.height,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1,
              color: rgb(0.9, 0.9, 0.9),
            });
            
            page.drawText('Gambar tidak tersedia', {
              x: imageBox.x + (imageBox.width / 2) - 50,
              y: imageBox.y + (imageBox.height / 2),
              size: 10,
              font: regularFont,
              color: rgb(0.5, 0.5, 0.5),
            });
          }
        }
      }
    }
    
    // Delete the temporary polygon image after use
    try {
      await fs.unlink(polygonImage);
    } catch (error) {
      console.error('Error deleting temporary polygon image:', error);
    }
    
    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pemetaan_${form.nama_pemilik}_${form.id}.pdf`);
    res.send(pdfBytes);
  } catch (err) {
    console.error('Error generate PDF:', err);
    res.status(500).json({ success: false, message: 'Gagal generate PDF' });
  }
};

// Helper function to draw polygon
async function drawPolygon(points, width, height) {
  // Create a temporary canvas to draw the polygon
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Find the bounding box of all points for scaling
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach(point => {
    minX = Math.min(minX, point.utm_x);
    minY = Math.min(minY, point.utm_y);
    maxX = Math.max(maxX, point.utm_x);
    maxY = Math.max(maxY, point.utm_y);
  });
  
  // Calculate the scale and offset to fit the polygon in the canvas
  // Add some padding
  const padding = 20;
  const scaleX = (width - 2 * padding) / (maxX - minX || 1); // Avoid division by zero
  const scaleY = (height - 2 * padding) / (maxY - minY || 1);
  const scale = Math.min(scaleX, scaleY);
  
  // Translate to center the polygon
  const offsetX = padding + (width - 2 * padding - scale * (maxX - minX)) / 2;
  const offsetY = padding + (height - 2 * padding - scale * (maxY - minY)) / 2;
  
  // Draw the polygon
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);
  
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  // Convert the first point
  const firstPoint = points[0];
  const startX = offsetX + scale * (firstPoint.utm_x - minX);
  const startY = height - (offsetY + scale * (firstPoint.utm_y - minY)); // Flip Y axis for canvas coordinates
  
  ctx.moveTo(startX, startY);
  
  // Draw the rest of the points
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const x = offsetX + scale * (point.utm_x - minX);
    const y = height - (offsetY + scale * (point.utm_y - minY)); // Flip Y axis for canvas coordinates
    ctx.lineTo(x, y);
  }
  
  // Close the path
  ctx.lineTo(startX, startY);
  ctx.stroke();
  
  // Save the canvas to a temporary file
  const tempFilePath = path.join(__dirname, 'temp', `polygon_${Date.now()}.png`);
  // Ensure the temp directory exists
  await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
  
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(tempFilePath, buffer);
  
  return tempFilePath;
}

// Helper function to get Indonesian month name
function getMonthName(monthIndex) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[monthIndex];
}

// Function to download image from URL and return as Buffer
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return response.data;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    throw error;
  }
}

module.exports = {
    formData,
    getFormByUserId,
    hapusForm,
    updateForm,
    generatePdf
}