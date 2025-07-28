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

        // Header section with logo and contact info
        let yPosition = 15;

        try {
            const fs = await import("fs");
            const path = await import("path");

            // Try to load actual logo
            const logoPath = path.join(
                process.cwd(),
                "public",
                "LOGO-damina.jpg"
            );
            const logoBuffer = fs.readFileSync(logoPath);
            const logoBase64 = logoBuffer.toString("base64");

            // Add logo to PDF
            doc.addImage(
                `data:image/png;base64,${logoBase64}`,
                "PNG",
                20,
                8,
                40,
                15
            );
        } catch (error) {
            console.log("Could not load logo, using styled placeholder");
            // Professional styled placeholder
            doc.setFillColor(70, 130, 180);
            doc.rect(20, 8, 40, 15, "F");
            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(255, 255, 255);
            doc.text("DAMINA", 23, 14);
            doc.text("SOLUTIONS", 23, 19);
        }

        // Contact information in header (right side)
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 130, 180); // Blue color

        const contactText =
            "E-mail: mentenanta@damina.ro ; Telefon: 0743.200.391";
        const pageWidth = doc.internal.pageSize.getWidth();
        const contactWidth = doc.getTextWidth(contactText);
        const contactX = pageWidth - contactWidth - 20; // Right-aligned with margin
        doc.text(contactText, contactX, 18);

        // Decorative line under header
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.8);
        doc.line(20, 28, 190, 28);

        // Reset text color for content
        doc.setTextColor(0, 0, 0);
        yPosition = 40;

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
        const maxWidth = 170;
        const description = reportData.descriereActivitate || "";

        // Split text properly
        const lines = doc.splitTextToSize(description, maxWidth);

        for (let i = 0; i < lines.length; i++) {
            doc.text(lines[i], 20, yPosition);
            yPosition += 5;
        }

        yPosition += 10;

        // Completion status - only show if data is present (for interventions)
        if (
            reportData.lucrareFinalizata ||
            reportData.tipActivitateRoman === "Corectiv"
        ) {
            doc.setFont("helvetica", "bold");
            doc.text("Lucrare finalizata: DA NU", 20, yPosition);
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

        // Add footer with contract information
        yPosition += 20;

        // Contract footer based on type
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 130, 180); // Blue color like header

        let footerText = "";
        if (reportData.templateType === "Administrativ") {
            footerText =
                "Contract de mentenanta - Lucrari administrative | E-mail: mentenanta@damina.ro | Tel: 0743.200.391";
        } else if (reportData.templateType === "Industrial") {
            footerText =
                "Contract constructii industriale | E-mail: mentenanta@damina.ro | Tel: 0743.200.391";
        } else {
            footerText =
                "Contract mentenanta caseta | E-mail: mentenanta@damina.ro | Tel: 0743.200.391";
        }

        const footerWidth = doc.getTextWidth(footerText);
        const footerX = (pageWidth - footerWidth) / 2;
        doc.text(footerText, footerX, yPosition);

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
