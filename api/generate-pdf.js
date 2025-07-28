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

        // Get page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Modern header design without rectangle
        // Company name in header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(70, 130, 180); // Blue color
        doc.text("DAMINA SOLUTIONS", 20, 15);

        // Contact information in header
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0); // Black color
        doc.text("Email: office@damina-solutions.ro", 20, 22);
        doc.text("Tel: +40 123 456 789", pageWidth - 60, 22);

        // Set initial position
        let yPosition = 35;

        // Add top line under header
        doc.setDrawColor(70, 130, 180);
        doc.setLineWidth(1);
        doc.line(20, 28, pageWidth - 20, 28);

        // Title section with proper formatting
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(70, 130, 180); // Blue color

        let titleLines = [];

        if (reportData.templateType === "Administrativ") {
            titleLines = [
                "FIȘA DE LUCRU nr............ din " +
                    (reportData.formattedDate || ""),
                "Lucrări de MENTENANȚĂ",
            ];
        } else if (reportData.templateType === "Caseta") {
            titleLines = [
                "FIȘA DE LUCRU MENTENANȚĂ CASETA",
                "din " + (reportData.formattedDate || ""),
            ];
        } else {
            titleLines = [
                "FIȘA DE LUCRU PENTRU CONSTRUCȚII INDUSTRIALE",
                "Nr ..... din " + (reportData.formattedDate || ""),
            ];
        }

        // Draw each title line centered
        titleLines.forEach((line, index) => {
            // Check if line is too long and needs to be split
            const maxLineWidth = pageWidth - 40; // 20mm margins
            if (doc.getTextWidth(line) > maxLineWidth) {
                // Split long lines
                const splitLines = doc.splitTextToSize(line, maxLineWidth);
                splitLines.forEach((splitLine, splitIndex) => {
                    const lineWidth = doc.getTextWidth(splitLine);
                    const lineX = (pageWidth - lineWidth) / 2;
                    doc.text(
                        splitLine,
                        lineX,
                        yPosition + index * 6 + splitIndex * 5
                    );
                });
                yPosition += (splitLines.length - 1) * 5; // Adjust position for extra lines
            } else {
                const lineWidth = doc.getTextWidth(line);
                const lineX = (pageWidth - lineWidth) / 2;
                doc.text(line, lineX, yPosition + index * 6);
            }
        });

        yPosition += titleLines.length * 6 + 10;

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
            doc.text(
                line,
                lineX,
                footerY - (footerLines.length - 1 - index) * 4
            );
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
