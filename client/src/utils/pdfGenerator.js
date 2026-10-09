import { jsPDF } from "jspdf";
import { formatDateTime, shortenAddress, shortenHash } from "./cryptoUtils";

/**
 * Generates and triggers download of a high-resolution, premium Certificate of Ownership
 * @param {object} photo Photo metadata object
 */
export async function generateOwnershipCertificate(photo) {
  // A4 Landscape: 297mm wide x 210mm high
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // Background
  doc.setFillColor(10, 15, 29); // #0a0f1d dark navy
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Outer Decorative Border (Gold/Teal gradient simulation)
  doc.setDrawColor(20, 184, 166); // Teal border
  doc.setLineWidth(1.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner Thin Border
  doc.setDrawColor(245, 158, 11); // Gold accent
  doc.setLineWidth(0.5);
  doc.rect(14, 14, pageWidth - 28, pageHeight - 28);

  // Corner Ornaments
  const corners = [
    [14, 14],
    [pageWidth - 14, 14],
    [14, pageHeight - 14],
    [pageWidth - 14, pageHeight - 14],
  ];
  doc.setFillColor(245, 158, 11);
  corners.forEach(([cx, cy]) => {
    doc.circle(cx, cy, 1.8, "F");
  });

  // Top Protocol Badge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(20, 184, 166);
  doc.text("PHOTOPROOF DECENTRALIZED PROTOCOL", pageWidth / 2, 25, { align: "center" });

  // Certificate Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("CERTIFICATE OF DIGITAL PHOTO OWNERSHIP", pageWidth / 2, 36, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text(
    "Cryptographically Registered & Timestamped on the Ethereum Sepolia Blockchain",
    pageWidth / 2,
    43,
    { align: "center" }
  );

  // Dividing Line
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.4);
  doc.line(40, 48, pageWidth - 40, 48);

  // Certificate Statement
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  const declaration =
    `This document certifies that the creative work titled "${photo.title || "Untitled"}" by ` +
    `${photo.authorName || "Anonymous Creator"} has been immutably registered on-chain. ` +
    `The cryptographic proof establishes indisputable priority and provenance.`;
  doc.text(declaration, pageWidth / 2, 56, { align: "center", maxWidth: 220 });

  // Content Columns Box
  doc.setFillColor(15, 23, 42); // slate-900 box
  doc.roundedRect(24, 65, pageWidth - 48, 100, 3, 3, "F");
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.roundedRect(24, 65, pageWidth - 48, 100, 3, 3, "S");

  // Attempt to draw image preview on left side of the box
  let imageRendered = false;
  if (photo.ipfsUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = photo.ipfsUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 1500); // safety timeout
      });

      if (img.complete && img.naturalWidth > 0) {
        doc.addImage(img, "JPEG", 32, 73, 60, 60, undefined, "FAST");
        doc.setDrawColor(20, 184, 166);
        doc.setLineWidth(0.5);
        doc.rect(32, 73, 60, 60);
        imageRendered = true;
      }
    } catch (e) {
      // Ignore image render error, proceed with metadata layout
    }
  }

  const leftMargin = imageRendered ? 102 : 36;
  let currentY = 75;
  const lineSpacing = 11;

  const addField = (label, value, isMonospace = false, isHighlight = false) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(label.toUpperCase(), leftMargin, currentY);

    if (isMonospace) {
      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
    }

    if (isHighlight) {
      doc.setTextColor(45, 212, 191); // Teal
    } else {
      doc.setTextColor(241, 245, 249); // White
    }

    doc.text(String(value || "N/A"), leftMargin, currentY + 4.5);
    currentY += lineSpacing;
  };

  addField("Photo Title", photo.title || "Untitled");
  addField("Registered Creator / Author", photo.authorName || "Anonymous Creator");
  addField("Current Owner Wallet", photo.walletAddress || "N/A", true);
  addField("SHA-256 Cryptographic Hash", photo.sha256Hash || "N/A", true, true);
  addField("Perceptual Hash (pHash)", photo.pHash || "N/A", true);
  addField("IPFS Content Identifier (CID)", photo.ipfsCID || "N/A", true);
  addField(
    "Blockchain Timestamp",
    formatDateTime(photo.blockchainTimestamp || photo.createdAt)
  );
  addField("Ethereum Sepolia Tx Hash", photo.txHash || "N/A", true);

  // Gold Seal Badge Bottom Right
  const sealX = pageWidth - 45;
  const sealY = pageHeight - 32;

  doc.setFillColor(245, 158, 11); // Gold fill
  doc.circle(sealX, sealY, 11, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.6);
  doc.circle(sealX, sealY, 9, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text("OFFICIAL", sealX, sealY - 3, { align: "center" });
  doc.setFontSize(8);
  doc.text("VERIFIED", sealX, sealY + 0.5, { align: "center" });
  doc.setFontSize(6.5);
  doc.text("ON-CHAIN", sealX, sealY + 4, { align: "center" });

  // Bottom Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Certificate ID: PP-${(photo.sha256Hash || "0000").substring(0, 8).toUpperCase()} • Verify online at PhotoProof or Sepolia Etherscan`,
    pageWidth / 2 - 15,
    pageHeight - 20,
    { align: "center" }
  );

  // Trigger download
  const cleanTitle = (photo.title || "photoproof").replace(/[^a-zA-Z0-9_-]/g, "_");
  doc.save(`PhotoProof_Certificate_${cleanTitle}.pdf`);
}
