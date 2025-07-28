// api/generate-pdf.js
// Fixed PDF generation using jsPDF with proper syntax

export default async function handler(req, res) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { jsPDF } = await import("jspdf");

        console.log("📄 Creating PDF with jsPDF");
        console.log("📨 Raw request body:", req.body);
        console.log("📨 Request body type:", typeof req.body);
        console.log("📨 Request headers:", req.headers);

        // Parse request - handle multiple formats
        let requestData = {};

        if (req.body) {
            if (typeof req.body === "string") {
                try {
                    requestData = JSON.parse(req.body);
                    console.log("✅ Parsed string body as JSON");
                } catch (e) {
                    console.error("❌ Failed to parse string body as JSON:", e);
                    // Try to extract data from form-data or other formats
                    if (req.body.includes("data=")) {
                        const dataMatch = req.body.match(/data=([^&]+)/);
                        if (dataMatch) {
                            try {
                                requestData = JSON.parse(
                                    decodeURIComponent(dataMatch[1])
                                );
                                console.log(
                                    "✅ Extracted data from form format"
                                );
                            } catch (e2) {
                                console.error(
                                    "❌ Failed to parse form data:",
                                    e2
                                );
                            }
                        }
                    }
                }
            } else if (typeof req.body === "object") {
                requestData = req.body;
                console.log("✅ Using object body directly");
            }
        }

        console.log("📋 Final request data:", requestData);

        // Handle different data structures
        let reportData;
        if (requestData.data) {
            reportData = requestData.data;
        } else if (requestData.templateType) {
            reportData = requestData;
        } else {
            console.error("❌ No valid data structure found");
            return res.status(400).json({
                error: "Invalid request format",
                received: requestData,
                expectedFormat: {
                    data: { templateType: "...", formattedDate: "..." },
                },
            });
        }

        console.log("📄 Report data to use:", reportData);

        if (!reportData) {
            return res.status(400).json({ error: "Report data is required" });
        }

        console.log("Report data:", reportData);

        // Create PDF with proper settings
        const doc = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4",
        });

        // Replace the entire logo loading section with this:
        try {
            // Your logo as base64 (replace YOUR_LOGO_BASE64_HERE with actual base64)
            const logoBase64 =
                "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";

            if (
                logoBase64 &&
                logoBase64 !==
                    "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"
            ) {
                // Add logo to PDF
                doc.addImage(logoBase64, "PNG", 20, 8, 40, 15);
                console.log("✅ Logo loaded from base64");
            } else {
                throw new Error("No base64 logo provided");
            }
        } catch (error) {
            console.log("Using styled placeholder logo");
            // Professional styled placeholder
            doc.setFillColor(70, 130, 180);
            doc.rect(20, 8, 40, 15, "F");
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            doc.text("DAMINA", 23, 14);
            doc.text("SOLUTIONS", 23, 19);
        }

        // Set initial position
        let yPosition = 30;

        // Add top line
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, 20, 190, 20);

        // Title section with blue styling and proper formatting
        doc.setFontSize(10); // Further reduced font size to 10
        doc.setFont("helvetica", "bold");
        doc.setTextColor(70, 130, 180); // Blue color

        let titleText = "";
        let subtitleText = "";

        if (reportData.templateType === "Administrativ") {
            titleText =
                "FIȘA DE LUCRU nr............ din " +
                (reportData.formattedDate || "");
            subtitleText = "Lucrări de MENTENANȚĂ";
        } else if (reportData.templateType === "Caseta") {
            titleText = "FIȘA DE LUCRU MENTENANȚĂ CASETA";
            subtitleText = "din " + (reportData.formattedDate || "");
        } else {
            titleText = "FIȘA DE LUCRU PENTRU CONSTRUCȚII INDUSTRIALE";
            subtitleText = "Nr ..... din " + (reportData.formattedDate || "");
        }

        // Center the title with proper width calculation
        const pageWidth = doc.internal.pageSize.getWidth();

        // Use a more conservative width to account for character spacing
        const maxWidth = pageWidth - 60; // Increased margins to 30mm each side
        let titleLines = doc.splitTextToSize(titleText, maxWidth);

        // If still too long, force break manually
        if (titleLines.length === 1 && doc.getTextWidth(titleLines[0]) > maxWidth) {
            // Manual word wrap for very long titles
            const words = titleText.split(' ');
            titleLines = [];
            let currentLine = '';
            
            for (let word of words) {
                const testLine = currentLine ? currentLine + ' ' + word : word;
                if (doc.getTextWidth(testLine) <= maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) titleLines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) titleLines.push(currentLine);
        }

        // Draw each line of the title centered
        titleLines.forEach((line, index) => {
            const lineWidth = doc.getTextWidth(line);
            const lineX = (pageWidth - lineWidth) / 2;
            doc.text(line, lineX, yPosition + index * 5); // Tighter line spacing
        });

        yPosition += titleLines.length * 5 + 8;

        // Subtitle
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const subtitleWidth = doc.getTextWidth(subtitleText);
        const subtitleX = (pageWidth - subtitleWidth) / 2;
        doc.text(subtitleText, subtitleX, yPosition);

        // Reset color for content
        doc.setTextColor(0, 0, 0);
        yPosition += 15;

        // Content fields
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");

        // Location
        doc.setFont("helvetica", "bold");
        doc.text("Locatia (Aria):", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(reportData.locatieCompleta || "", 55, yPosition);
        yPosition += 8;

        // Activity type (if not Administrativ)
        if (reportData.templateType !== "Administrativ") {
            doc.setFont("helvetica", "bold");
            doc.text("Tip activitate:", 20, yPosition);
            doc.setFont("helvetica", "normal");
            doc.text(reportData.tipActivitateRoman || "", 55, yPosition);
            yPosition += 8;
        }

        // Work name
        doc.setFont("helvetica", "bold");
        doc.text("Denumire lucrare:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(reportData.numelucrare || "", 60, yPosition);
        yPosition += 12;

        // Description
        doc.setFont("helvetica", "bold");
        doc.text("Descriere activitate:", 20, yPosition);
        yPosition += 8;

        doc.setFont("helvetica", "normal");
        const descriptionMaxWidth = 170; // Renamed to avoid duplicate with titleMaxWidth
        const description = reportData.descriereActivitate || "";

        // Split text properly
        const lines = doc.splitTextToSize(description, descriptionMaxWidth);

        for (let i = 0; i < lines.length; i++) {
            doc.text(lines[i], 20, yPosition);
            yPosition += 5;
        }

        yPosition += 10;

        // Completion status - show actual data from Airtable
        if (
            reportData.lucrareFinalizata ||
            reportData.tipActivitateRoman === "Corectiv"
        ) {
            doc.setFont("helvetica", "bold");

            // Get the actual value from Airtable
            let completionStatus = "";
            if (reportData.lucrareFinalizata) {
                if (
                    reportData.lucrareFinalizata.toLowerCase() === "da" ||
                    reportData.lucrareFinalizata.toLowerCase() === "yes"
                ) {
                    completionStatus = "DA";
                } else if (
                    reportData.lucrareFinalizata.toLowerCase() === "nu" ||
                    reportData.lucrareFinalizata.toLowerCase() === "no"
                ) {
                    completionStatus = "NU";
                } else {
                    completionStatus = reportData.lucrareFinalizata; // Use as-is if not DA/NU
                }
            } else {
                completionStatus = "DA NU"; // Show both options if no data
            }

            doc.text("Lucrare finalizata: " + completionStatus, 20, yPosition);
            yPosition += 20;
        } else {
            yPosition += 10; // Just add some space if not showing
        }

        // Signatures section with pre-filled names
        doc.setFont("helvetica", "bold");

        if (reportData.templateType === "Administrativ") {
            // Three columns with pre-filled names
            doc.text("Executant:", 20, yPosition);
            doc.text("Beneficiar Glina:", 80, yPosition);
            doc.text("Derulator contract:", 140, yPosition);

            yPosition += 10;
            doc.setFont("helvetica", "normal");

            // Pre-filled names from template
            doc.text("Nume: Balan", 20, yPosition);
            doc.text("Nume: Ciometti", 80, yPosition);
            doc.text("Nume: Cirstea", 140, yPosition);
            yPosition += 7;

            // Pre-filled first names
            doc.text("Prenume: Gabriel", 20, yPosition);
            doc.text("Prenume: Anton", 80, yPosition);
            doc.text("Prenume: Ciprian", 140, yPosition);
            yPosition += 7;

            // Signatures
            doc.text("Semnatura: __________", 20, yPosition);
            doc.text("Semnatura: __________", 80, yPosition);
            doc.text("Semnatura: __________", 140, yPosition);
            yPosition += 7;

            // Dates
            const dateText = "Data: " + (reportData.formattedDate || "");
            doc.text(dateText, 20, yPosition);
            doc.text(dateText, 80, yPosition);
            doc.text(dateText, 140, yPosition);
        } else if (reportData.templateType === "Industrial") {
            // Two columns with pre-filled names
            doc.text("Executant:", 30, yPosition);
            doc.text("Reprezentant ANB:", 130, yPosition);

            yPosition += 10;
            doc.setFont("helvetica", "normal");

            // Pre-filled names from template
            doc.text("Nume: Gabriel Balan", 30, yPosition);
            doc.text("Nume: Ciometti Anton", 130, yPosition);
            yPosition += 7;

            // Signatures
            doc.text("Semnatura: __________", 30, yPosition);
            doc.text("Semnatura: __________", 130, yPosition);
            yPosition += 7;

            // Dates
            const dateText = "Data: " + (reportData.formattedDate || "");
            doc.text(dateText, 30, yPosition);
            doc.text(dateText, 130, yPosition);
        } else {
            // Caseta
            // Two columns with pre-filled names
            doc.text("Nume: Nitu Dragos", 30, yPosition);
            doc.text("Nume: Chiriacescu Mihai", 130, yPosition);

            yPosition += 10;
            doc.setFont("helvetica", "normal");

            // Signatures
            doc.text("Semnatura: __________", 30, yPosition);
            doc.text("Semnatura: __________", 130, yPosition);
            yPosition += 7;

            // Dates
            const dateText = "Data: " + (reportData.formattedDate || "");
            doc.text(dateText, 30, yPosition);
            doc.text(dateText, 130, yPosition);
        }

        // Add footer with contract information (without contact details)
        const pageHeight = doc.internal.pageSize.getHeight();
        const footerY = pageHeight - 20; // Position footer 20mm from bottom

        // Contract footer based on type (simplified)
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(70, 130, 180); // Blue color like header

        let footerText = "";
        if (reportData.templateType === "Administrativ") {
            footerText = "Contract de mentenanță - Lucrări administrative";
        } else if (reportData.templateType === "Industrial") {
            footerText = "Contract construcții industriale";
        } else {
            footerText = "Contract mentenanță caseta";
        }

        // Ensure footer text fits within page margins
        const footerMaxWidth = pageWidth - 40; // 20mm margin on each side
        const footerLines = doc.splitTextToSize(footerText, footerMaxWidth);
        
        // Center each line of footer
        footerLines.forEach((line, index) => {
            const lineWidth = doc.getTextWidth(line);
            const lineX = (pageWidth - lineWidth) / 2;
            doc.text(line, lineX, footerY - (footerLines.length - 1 - index) * 4);
        });

        // Generate PDF buffer
        const pdfArrayBuffer = doc.output("arraybuffer");
        const pdfBuffer = Buffer.from(pdfArrayBuffer);

        console.log("✅ PDF generated successfully, size:", pdfBuffer.length);

        // Return PDF
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="construction-report.pdf"'
        );

        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("❌ PDF generation failed:", error);
        console.error("Error stack:", error.stack);
        return res.status(500).json({
            error: "PDF generation failed",
            message: error.message,
            stack: error.stack,
        });
    }
}
