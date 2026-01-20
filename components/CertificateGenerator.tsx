
import { jsPDF } from 'jspdf';
import { Course, User } from '../types';

export const generateCoursePDF = (user: User, course: Course) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor = [234, 0, 39]; // Crimson Red

  // 1. Right Side Decorative Ribbon
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(pageWidth - 45, 0, 45, pageHeight, 'F');
  
  // White cutouts in the ribbon for the EGA Seal and QR
  doc.setFillColor(255, 255, 255);
  // Seal background circle
  doc.circle(pageWidth - 22.5, pageHeight / 2 - 5, 22, 'F');
  // QR code area
  doc.roundedRect(pageWidth - 35, pageHeight - 55, 25, 25, 2, 2, 'F');

  // 2. Bottom Left Decorative Swoosh (Approximation)
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.beginPath();
  doc.moveTo(0, pageHeight - 40);
  doc.quadraticCurveTo(pageWidth / 3, pageHeight - 50, pageWidth / 2, pageHeight);
  doc.lineTo(0, pageHeight);
  doc.fill();

  doc.setFillColor(180, 150, 50); // Gold accent
  doc.beginPath();
  doc.moveTo(0, pageHeight - 30);
  doc.quadraticCurveTo(pageWidth / 4, pageHeight - 35, pageWidth / 2.5, pageHeight);
  doc.lineTo(0, pageHeight);
  doc.fill();

  // 3. VRT Logo (Top Left)
  // Simplified vector drawing of the gear logo
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.circle(30, 25, 8);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.text('VRT', 42, 28);
  
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Management Group', 42, 33);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('Inspire - Action - Growth', 42, 36);

  // 4. Main Content
  const centerX = (pageWidth - 45) / 2 + 10; // Centered in the white area

  // "Certificate of Completion"
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'bold');
  doc.setFontSize(54);
  doc.text('Certificate of Completion', centerX, 65, { align: 'center' });

  // "This Acknowledges that"
  doc.setFontSize(18);
  doc.setFont('times', 'bold');
  doc.text('This Acknowledges that', centerX, 80, { align: 'center' });

  // User Name (Cursive/Script feel using Times Bold Italic)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(48);
  doc.text(user.name, centerX, 110, { align: 'center' });

  // Completion Text
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  const bodyText = [
    `has successfully completed Entrepreneurs Growth Alliance, EGA`,
    `Workshop as part of`,
    `${course.title}.`
  ];
  doc.text(bodyText[0], centerX, 130, { align: 'center' });
  doc.text(bodyText[1], centerX, 140, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text(bodyText[2], centerX, 150, { align: 'center' });

  // 5. Footer Details
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const awardedDate = new Date().toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
  doc.text(`Awarded: ${awardedDate}`, 30, 185);

  // Signature Area
  const sigX = pageWidth - 140;
  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.text('Tedla Rajesh', sigX, 180); // Mimic script signature
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Rajesh Tedla', sigX, 185);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('CEO and Chief Transformation Officer', sigX, 190);
  doc.text('VRT Management Group, LLC.', sigX, 195);

  // 6. EGA Seal Area (On the right ribbon)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('EGA', pageWidth - 22.5, pageHeight / 2 - 2, { align: 'center' });
  doc.setFontSize(6);
  doc.text('Entrepreneur Growth Alliance', pageWidth - 22.5, pageHeight / 2 + 3, { align: 'center' });
  
  // Dummy QR code squares
  doc.setFillColor(15, 23, 42);
  doc.rect(pageWidth - 32, pageHeight - 52, 6, 6, 'F');
  doc.rect(pageWidth - 16, pageHeight - 52, 6, 6, 'F');
  doc.rect(pageWidth - 32, pageHeight - 36, 6, 6, 'F');
  doc.rect(pageWidth - 24, pageHeight - 44, 4, 4, 'F');

  // Save PDF
  doc.save(`VRT_Completion_Certificate_${user.name.replace(/\s+/g, '_')}.pdf`);
  
  // Note: In a real app, you would send this to a backend API to trigger an email.
  // We'll simulate a notification.
  console.log(`Certificate generated for ${user.email}. Sending notification...`);
};
